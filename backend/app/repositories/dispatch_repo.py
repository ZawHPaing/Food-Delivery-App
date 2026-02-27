from typing import List, Optional, Dict
from ..supabase_client import supabase
from datetime import datetime, timedelta

class DispatchRepository:
    @staticmethod
    def get_available_riders(city: Optional[str] = None) -> List[Dict]:
        """Get all riders who are online and available."""
        query = supabase.table("riders") \
            .select("id, user_id, current_latitude, current_longitude") \
            .eq("status", "available")
        
        if city:
            query = query.eq("city", city)
            
        response = query.execute()
        return response.data or []

    @staticmethod
    def create_dispatch_request(order_id: int, rider_id: int, timeout_seconds: int = 60) -> Optional[Dict]:
        """Create a new dispatch request for a rider."""
        expires_at = (datetime.utcnow() + timedelta(seconds=timeout_seconds)).isoformat()
        data = {
            "order_id": order_id,
            "rider_id": rider_id,
            "status": "pending",
            "expires_at": expires_at
        }
        response = supabase.table("dispatch_requests").insert(data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def update_dispatch_status(request_id: int, status: str) -> bool:
        """Update the status of a dispatch request."""
        response = supabase.table("dispatch_requests") \
            .update({"status": status}) \
            .eq("id", request_id) \
            .execute()
        return len(response.data) > 0 if response.data else False

    @staticmethod
    def get_pending_request(order_id: int) -> Optional[Dict]:
        """Get the currently pending request for an order."""
        response = supabase.table("dispatch_requests") \
            .select("*") \
            .eq("order_id", order_id) \
            .eq("status", "pending") \
            .maybe_single() \
            .execute()
        return response.data

    @staticmethod
    def get_attempted_rider_ids(order_id: int) -> List[int]:
        """Get rider ids who have already received a dispatch request for this order."""
        response = supabase.table("dispatch_requests") \
            .select("rider_id") \
            .eq("order_id", order_id) \
            .execute()
        rows = response.data or []
        return [r["rider_id"] for r in rows if r.get("rider_id") is not None]

    @staticmethod
    def get_order_details(order_id: int) -> Optional[Dict]:
        """Get full order details for the rider notification."""
        order_resp = supabase.table("orders") \
            .select("*, order_items(*, menu_items(name)), restaurants(name, latitude, longitude)") \
            .eq("id", order_id) \
            .single() \
            .execute()
        return order_resp.data
