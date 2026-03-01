from typing import List, Optional, Dict
from ..supabase_client import supabase
from datetime import datetime, timedelta


class DispatchRepository:
    @staticmethod
    def get_available_riders(city: Optional[str] = None) -> List[Dict]:
        import logging
        query = supabase.table("riders").select(
            "id, user_id, current_latitude, current_longitude, status"
        ).eq("status", "available")
        if city:
            query = query.eq("city", city)
        response = query.execute()
        riders = response.data or []
        logging.getLogger(__name__).info("[dispatch] get_available_riders count=%s riders=%s", len(riders), [(r.get("id"), r.get("user_id")) for r in riders])
        return riders

    @staticmethod
    def create_dispatch_request(
        order_id: int, rider_id: int, timeout_seconds: int = 60
    ) -> Optional[Dict]:
        expires_at = (datetime.utcnow() + timedelta(seconds=timeout_seconds)).isoformat()
        data = {
            "order_id": order_id,
            "rider_id": rider_id,
            "status": "pending",
            "expires_at": expires_at,
        }
        try:
            response = supabase.table("dispatch_requests").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception:
            return None

    @staticmethod
    def update_dispatch_status(request_id: int, status: str) -> bool:
        try:
            response = supabase.table("dispatch_requests").update(
                {"status": status}
            ).eq("id", request_id).execute()
            return bool(response.data)
        except Exception:
            return False

    @staticmethod
    def expire_other_requests_for_order(order_id: int, except_request_id: int) -> None:
        """When one rider accepts, mark all other pending requests for this order as expired."""
        try:
            supabase.table("dispatch_requests").update({"status": "expired"}).eq(
                "order_id", order_id
            ).eq("status", "pending").neq("id", except_request_id).execute()
        except Exception:
            pass

    @staticmethod
    def get_dispatch_request_by_id(request_id: int) -> Optional[Dict]:
        try:
            response = supabase.table("dispatch_requests") \
                .select("id, order_id, rider_id, status") \
                .eq("id", request_id) \
                .maybe_single() \
                .execute()
            data = getattr(response, "data", None)
            if data is None:
                return None
            if isinstance(data, list):
                return data[0] if data else None
            return data
        except Exception:
            return None

    @staticmethod
    def get_attempted_rider_ids(order_id: int) -> List[int]:
        try:
            response = supabase.table("dispatch_requests").select(
                "rider_id"
            ).eq("order_id", order_id).execute()
            rows = response.data or []
            return [r["rider_id"] for r in rows if r.get("rider_id") is not None]
        except Exception:
            return []

    @staticmethod
    def get_order_details(order_id: int) -> Optional[Dict]:
        """Get order with restaurant and order_items. Uses separate queries so relation names don't matter."""
        try:
            order_resp = supabase.table("orders").select("*").eq("id", order_id).maybe_single().execute()
            data = getattr(order_resp, "data", None)
            if not data:
                return None
            row = data[0] if isinstance(data, list) and data else data
            if not row:
                return None
            rid = row.get("restaurant_id")
            if rid is not None:
                rest_resp = supabase.table("restaurants").select("name, latitude, longitude").eq("id", rid).maybe_single().execute()
                rdata = getattr(rest_resp, "data", None)
                if rdata:
                    row["restaurant"] = rdata[0] if isinstance(rdata, list) and rdata else rdata
                else:
                    row["restaurant"] = {}
            else:
                row["restaurant"] = {}
            oi_resp = supabase.table("order_items").select("id, order_id, menu_item_id, quantity, price_cents").eq("order_id", order_id).execute()
            oi_data = getattr(oi_resp, "data", None) or []
            items = oi_data if isinstance(oi_data, list) else [oi_data] if oi_data else []
            menu_ids = [it.get("menu_item_id") for it in items if it.get("menu_item_id") is not None]
            name_map = {}
            if menu_ids:
                mi_resp = supabase.table("menu_items").select("id, name").in_("id", menu_ids).execute()
                mi_data = getattr(mi_resp, "data", None) or []
                for m in (mi_data if isinstance(mi_data, list) else [mi_data]):
                    name_map[m.get("id")] = m.get("name") or "Item"
            for it in items:
                it["menu_items"] = {"name": name_map.get(it.get("menu_item_id"), "Item")}
            row["order_items"] = items
            return row
        except Exception as e:
            import logging
            logging.warning("get_order_details failed for order_id=%s: %s", order_id, e)
            return None

    @staticmethod
    def get_pending_requests_for_rider(rider_id: int) -> List[Dict]:
        """Pending dispatch_requests for this rider (status=pending, not expired)."""
        try:
            response = supabase.table("dispatch_requests").select(
                "id, order_id, rider_id, status, expires_at"
            ).eq("rider_id", rider_id).eq("status", "pending").execute()
            return response.data or []
        except Exception:
            return []
