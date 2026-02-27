import asyncio
from typing import List, Optional, Dict
from ..repositories.dispatch_repo import DispatchRepository
from ..core.location_utils import haversine_distance
from ..core.websocket_manager import manager
from datetime import datetime

class DispatchService:
    ORDER_COORDS: Dict[int, Dict[str, float]] = {}

    @staticmethod
    async def dispatch_order(
        order_id: int,
        customer_latitude: Optional[float] = None,
        customer_longitude: Optional[float] = None,
    ):
        """
        Find best rider and notify in priority order.
        Priority = weighted proximity to restaurant + customer location (when provided).
        """
        if customer_latitude is not None and customer_longitude is not None:
            DispatchService.ORDER_COORDS[order_id] = {
                "lat": float(customer_latitude),
                "lon": float(customer_longitude),
            }

        saved_coords = DispatchService.ORDER_COORDS.get(order_id)

        order_details = DispatchRepository.get_order_details(order_id)
        if not order_details or not order_details.get('restaurants'):
            print(f"Cannot dispatch order {order_id}: Missing restaurant data.")
            return

        restaurant = order_details['restaurants']
        rest_lat = restaurant.get('latitude')
        rest_lon = restaurant.get('longitude')
        
        if rest_lat is None or rest_lon is None:
            if saved_coords:
                rest_lat = saved_coords["lat"]
                rest_lon = saved_coords["lon"]
                print(f"Order {order_id}: restaurant coords missing, using customer coords as fallback.")
            else:
                # Final fallback to avoid hard stop in dispatch.
                rest_lat, rest_lon = 16.87, 96.20
                print(f"Order {order_id}: restaurant coords missing, using system fallback coords.")

        all_riders = DispatchRepository.get_available_riders()
        if not all_riders:
            print(f"No available riders for order {order_id}.")
            return

        FALLBACK_LAT, FALLBACK_LON = 16.87, 96.20
        attempted_rider_ids = set(DispatchRepository.get_attempted_rider_ids(order_id))
        rider_scores = []

        for rider in all_riders:
            if rider["id"] in attempted_rider_ids:
                continue

            rider_lat = rider.get('current_latitude') or FALLBACK_LAT
            rider_lon = rider.get('current_longitude') or FALLBACK_LON

            dist_to_restaurant = haversine_distance(
                float(rest_lat), float(rest_lon), float(rider_lat), float(rider_lon)
            )
            dist_to_customer = None
            if saved_coords:
                dist_to_customer = haversine_distance(
                    float(saved_coords["lat"]),
                    float(saved_coords["lon"]),
                    float(rider_lat),
                    float(rider_lon),
                )

            # Weighted score: restaurant first, customer second.
            score = dist_to_restaurant if dist_to_customer is None else (0.6 * dist_to_restaurant + 0.4 * dist_to_customer)
            rider_scores.append({
                "rider_id": rider['id'],
                "user_id": rider['user_id'],
                "distance_to_restaurant": dist_to_restaurant,
                "distance_to_customer": dist_to_customer,
                "score": score,
            })

        if not rider_scores:
            print(f"No eligible riders left for order {order_id}.")
            return

        rider_scores.sort(key=lambda x: x['score'])

        for candidate in rider_scores:
            request = DispatchRepository.create_dispatch_request(order_id, candidate['rider_id'])
            if not request:
                continue

            payload = {
                "type": "NEW_ORDER_REQUEST",
                "request_id": request['id'],
                "order_id": order_id,
                "restaurant_name": restaurant['name'],
                "items": [
                    {"name": item['menu_items']['name'], "quantity": item['quantity']} 
                    for item in order_details.get('order_items', [])
                ],
                "customer_name": f"{order_details.get('first_name', '')} {order_details.get('last_name', '')}".strip(),
                "delivery_address": order_details.get('delivery_address'),
                "distance": round(candidate['distance_to_restaurant'], 2),
                "distance_to_restaurant": round(candidate['distance_to_restaurant'], 2),
                "distance_to_customer": round(candidate['distance_to_customer'], 2) if candidate['distance_to_customer'] is not None else None,
                "match_score": round(candidate['score'], 2),
                "expires_at": request['expires_at']
            }

            success = await manager.send_personal_message(payload, candidate['user_id'])
            if success:
                print(f"Dispatch request sent to Rider {candidate['rider_id']} for Order {order_id}.")
                asyncio.create_task(DispatchService.monitor_timeout(request['id'], order_id))
                return

            print(f"Failed to send WebSocket to Rider {candidate['rider_id']} (offline).")
            DispatchRepository.update_dispatch_status(request['id'], 'expired')

        print(f"Unable to notify any available rider for Order {order_id}.")

    @staticmethod
    async def monitor_timeout(request_id: int, order_id: int):
        """Wait for the timeout and re-dispatch if still pending."""
        await asyncio.sleep(65) # Wait slightly longer than the 60s timeout
        
        # Check current status
        # We need a way to check if it's still pending. Let's add that to repo or just query here.
        from ..supabase_client import supabase
        resp = supabase.table("dispatch_requests").select("status").eq("id", request_id).single().execute()
        
        if resp.data and resp.data['status'] == 'pending':
            print(f"Request {request_id} expired for Order {order_id}. Re-dispatching...")
            supabase.table("dispatch_requests").update({"status": "expired"}).eq("id", request_id).execute()
            await DispatchService.dispatch_order(order_id)

    @staticmethod
    async def handle_rider_response(rider_id: int, request_id: int, action: str):
        """Process rider's accept or reject action."""
        # Find order_id first
        from ..supabase_client import supabase
        req_resp = supabase.table("dispatch_requests").select("order_id, status").eq("id", request_id).single().execute()
        if not req_resp.data:
            return False, "Request not found"
            
        if req_resp.data['status'] != 'pending':
            return False, f"Request is already {req_resp.data['status']}"

        order_id = req_resp.data['order_id']

        if action == 'accept':
            DispatchRepository.update_dispatch_status(request_id, 'accepted')
            supabase.table("orders").update({
                "status": "rider_assigned",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", order_id).execute()

            delivery_data = {
                "order_id": order_id,
                "rider_id": rider_id,
                "status": "pending_pickup"
            }
            supabase.table("deliveries").insert(delivery_data).execute()

            supabase.table("riders").update({"status": "busy"}).eq("id", rider_id).execute()

            # Close any other pending requests for this order.
            supabase.table("dispatch_requests").update({"status": "expired"}).eq("order_id", order_id).eq("status", "pending").execute()

            order_resp = supabase.table("orders").select("user_id").eq("id", order_id).execute()
            if order_resp.data:
                customer_user_id = order_resp.data[0].get("user_id")
                rider_user = supabase.table("riders").select("user_id").eq("id", rider_id).execute()
                rider_name = "Your rider"
                if rider_user.data:
                    ru = supabase.table("users").select("first_name, last_name").eq("id", rider_user.data[0]["user_id"]).execute()
                    if ru.data:
                        rider_name = f"{ru.data[0].get('first_name', '')} {ru.data[0].get('last_name', '')}".strip()

                await manager.send_to_customer(customer_user_id, {
                    "type": "ORDER_STATUS_UPDATE",
                    "order_id": order_id,
                    "status": "rider_assigned",
                    "rider_name": rider_name,
                    "timestamp": datetime.utcnow().isoformat()
                })

            if order_id in DispatchService.ORDER_COORDS:
                del DispatchService.ORDER_COORDS[order_id]

            return True, "Order accepted"
        else:
            DispatchRepository.update_dispatch_status(request_id, 'rejected')
            asyncio.create_task(DispatchService.dispatch_order(order_id))
            return True, "Order rejected"

