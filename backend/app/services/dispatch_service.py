import asyncio
import json
import logging
from typing import Dict, Optional, List
from ..repositories.dispatch_repo import DispatchRepository
from ..core.location_utils import haversine_distance
from ..core.websocket_manager import manager
from datetime import datetime
from fastapi import WebSocket

log = logging.getLogger(__name__)


class DispatchService:
    ORDER_COORDS: Dict[int, Dict[str, float]] = {}

    @staticmethod
    async def dispatch_order(
        order_id: int,
        customer_latitude: Optional[float] = None,
        customer_longitude: Optional[float] = None,
    ):
        log.info("[dispatch] order_id=%s dispatch_order started", order_id)
        if customer_latitude is not None and customer_longitude is not None:
            DispatchService.ORDER_COORDS[order_id] = {
                "lat": float(customer_latitude),
                "lon": float(customer_longitude),
            }
        saved_coords = DispatchService.ORDER_COORDS.get(order_id)

        order_details = DispatchRepository.get_order_details(order_id)
        if not order_details:
            log.warning("[dispatch] order_id=%s get_order_details returned None", order_id)
            return
        log.info("[dispatch] order_id=%s order_details ok, restaurant_id=%s", order_id, order_details.get("restaurant_id"))

        # Set order status to "ready" so customer Order Progress shows "Finding a delivery rider"
        try:
            from ..supabase_client import supabase
            supabase.table("orders").update({
                "status": "ready",
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("id", order_id).execute()
        except Exception:
            pass

        restaurant = order_details.get("restaurants") or order_details.get("restaurant") or {}
        if isinstance(restaurant, list):
            restaurant = restaurant[0] if restaurant else {}
        rest_lat = restaurant.get("latitude")
        rest_lon = restaurant.get("longitude")
        if rest_lat is None or rest_lon is None:
            rest_lat, rest_lon = 16.87, 96.20

        all_riders = DispatchRepository.get_available_riders()
        if not all_riders:
            log.warning("[dispatch] order_id=%s no available riders (get_available_riders empty)", order_id)
            return
        log.info("[dispatch] order_id=%s found %s available riders, user_ids=%s", order_id, len(all_riders), [r.get("user_id") for r in all_riders])

        FALLBACK = 16.87, 96.20
        attempted = set(DispatchRepository.get_attempted_rider_ids(order_id))
        rider_scores = []
        for rider in all_riders:
            if rider["id"] in attempted:
                continue
            rlat = rider.get("current_latitude") or FALLBACK[0]
            rlon = rider.get("current_longitude") or FALLBACK[1]
            dist_rest = haversine_distance(
                float(rest_lat), float(rest_lon), float(rlat), float(rlon)
            )
            dist_cust = None
            if saved_coords:
                dist_cust = haversine_distance(
                    saved_coords["lat"], saved_coords["lon"], float(rlat), float(rlon)
                )
            score = dist_rest if dist_cust is None else 0.6 * dist_rest + 0.4 * dist_cust
            rider_scores.append({
                "rider_id": rider["id"],
                "user_id": rider["user_id"],
                "distance_to_restaurant": dist_rest,
                "distance_to_customer": dist_cust,
                "score": score,
            })

        rider_scores.sort(key=lambda x: x["score"])
        order_items = order_details.get("order_items") or []
        items_payload = []
        for i in order_items:
            mi = i.get("menu_items") or i.get("menu_item")
            name = (mi.get("name") if isinstance(mi, dict) else None) or "Item"
            items_payload.append({"name": name, "quantity": i.get("quantity", 0)})

        for candidate in rider_scores:
            request = DispatchRepository.create_dispatch_request(order_id, candidate["rider_id"])
            if not request:
                log.warning("[dispatch] order_id=%s create_dispatch_request failed for rider_id=%s", order_id, candidate["rider_id"])
                continue
            payload = {
                "type": "NEW_ORDER_REQUEST",
                "request_id": request["id"],
                "order_id": order_id,
                "restaurant_name": restaurant.get("name", ""),
                "items": items_payload,
                "customer_name": "",
                "delivery_address": order_details.get("delivery_address"),
                "distance": round(candidate["distance_to_restaurant"], 2),
                "expires_at": request.get("expires_at"),
            }
            user_id = candidate["user_id"]
            success = await manager.send_personal_message(payload, user_id)
            log.info("[dispatch] order_id=%s send_personal_message to user_id=%s -> %s", order_id, user_id, success)
            if success:
                asyncio.create_task(DispatchService._monitor_timeout(request["id"], order_id))
                return
            # Leave request pending so rider sees it when they connect or poll (do not mark expired)

    @staticmethod
    async def _monitor_timeout(request_id: int, order_id: int):
        await asyncio.sleep(65)
        from ..supabase_client import supabase
        try:
            resp = supabase.table("dispatch_requests").select("status").eq("id", request_id).maybe_single().execute()
            if resp.data and resp.data.get("status") == "pending":
                supabase.table("dispatch_requests").update({"status": "expired"}).eq("id", request_id).execute()
                await DispatchService.dispatch_order(order_id)
        except Exception:
            pass

    @staticmethod
    def _build_request_payload(
        order_details: Dict,
        request: Dict,
        distance: float = 0.0,
    ) -> Dict:
        restaurant = order_details.get("restaurants") or order_details.get("restaurant") or {}
        if isinstance(restaurant, list):
            restaurant = restaurant[0] if restaurant else {}
        order_items = order_details.get("order_items") or []
        items_payload = []
        for i in order_items:
            mi = i.get("menu_items") or i.get("menu_item")
            name = (mi.get("name") if isinstance(mi, dict) else None) or "Item"
            items_payload.append({"name": name, "quantity": i.get("quantity", 0)})
        return {
            "type": "NEW_ORDER_REQUEST",
            "request_id": request["id"],
            "order_id": order_details.get("id") or request.get("order_id"),
            "restaurant_name": restaurant.get("name", ""),
            "items": items_payload,
            "customer_name": "",
            "delivery_address": order_details.get("delivery_address"),
            "distance": round(float(distance), 2),
            "expires_at": request.get("expires_at"),
        }

    @staticmethod
    async def send_pending_requests_for_rider(user_id: int, websocket: WebSocket) -> None:
        """When rider connects, send any pending dispatch requests they have (so they see orders they missed)."""
        from ..repositories.delivery_repo import DeliveryRepository
        rider = DeliveryRepository.get_rider_by_user_id(user_id)
        if not rider:
            log.warning("[dispatch] send_pending: no rider for user_id=%s", user_id)
            return
        rider_id = rider.get("id")
        if not rider_id:
            return
        pending = DispatchRepository.get_pending_requests_for_rider(rider_id)
        log.info("[dispatch] send_pending: user_id=%s rider_id=%s pending_count=%s", user_id, rider_id, len(pending))
        for req in pending:
            order_id = req.get("order_id")
            if not order_id:
                continue
            order_details = DispatchRepository.get_order_details(order_id)
            if not order_details:
                continue
            payload = DispatchService._build_request_payload(order_details, req, distance=0.0)
            try:
                await websocket.send_text(json.dumps(payload))
            except Exception:
                break
