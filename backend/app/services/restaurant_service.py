from typing import List, Dict, Any, Optional
from ..supabase_client import supabase
from ..core.websocket_manager import manager
from datetime import datetime
import asyncio

VALID_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["rider_assigned"],
    "rider_assigned": ["picked_up"],
    "picked_up": ["delivered"],
}


class RestaurantService:
    @staticmethod
    def get_orders_for_restaurant(restaurant_id: int) -> List[Dict[str, Any]]:
        try:
            resp = supabase.table("orders").select(
                "*, order_items(*, menu_items(name))"
            ).eq("restaurant_id", restaurant_id).order("created_at", desc=True).execute()
            orders = resp.data or []
            for order in orders:
                uid = order.get("user_id")
                if uid:
                    u = supabase.table("users").select("first_name, last_name, phone").eq("id", uid).maybe_single().execute()
                    if u.data:
                        order["customer"] = u.data
            return orders
        except Exception:
            return []

    @staticmethod
    async def update_order_status(
        order_id: int, new_status: str, restaurant_id: int
    ) -> Optional[Dict[str, Any]]:
        try:
            order_resp = supabase.table("orders").select("*").eq("id", order_id).eq("restaurant_id", restaurant_id).maybe_single().execute()
            if not order_resp.data:
                return None
            order = order_resp.data
            current = order.get("status", "pending")
            allowed = VALID_TRANSITIONS.get(current, [])
            if new_status not in allowed:
                raise ValueError(f"Cannot move from '{current}' to '{new_status}'")
            supabase.table("orders").update({"status": new_status}).eq("id", order_id).execute()
            updated = supabase.table("orders").select("*").eq("id", order_id).maybe_single().execute()
            if updated.data and order.get("user_id"):
                await manager.send_to_customer(order["user_id"], {
                    "type": "ORDER_STATUS_UPDATE",
                    "order_id": order_id,
                    "status": new_status,
                    "timestamp": datetime.utcnow().isoformat(),
                })
            if new_status == "ready":
                from ..services.dispatch_service import DispatchService
                asyncio.create_task(DispatchService.dispatch_order(order_id))
            return updated.data
        except ValueError:
            raise
        except Exception:
            return None

    @staticmethod
    def get_restaurant_by_user_id(user_id: int) -> Optional[Dict[str, Any]]:
        try:
            resp = supabase.table("restaurants").select("*").eq("user_id", user_id).maybe_single().execute()
            return resp.data if resp.data else None
        except Exception:
            return None
