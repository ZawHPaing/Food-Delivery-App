from typing import List, Optional, Dict, Any
from ..supabase_client import supabase

class DeliveryRepository:
    
    @staticmethod
    def find_user_by_email(email: str) -> Optional[Dict]:
        """Find user by email"""
        response = supabase.table("users") \
            .select("*") \
            .eq("email", email) \
            .single() \
            .execute()
        return response.data if response.data else None
    
    @staticmethod
    def create_user(user_data: dict) -> Optional[Dict]:
        """Create a new user"""
        response = supabase.table("users").insert(user_data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def create_rider(rider_data: dict) -> Optional[Dict]:
        """Create a new rider"""
        response = supabase.table("riders").insert(rider_data).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_rider_by_user_id(user_id: int) -> Optional[Dict]:
        """Get rider by user ID"""
        response = supabase.table("riders") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_delivery_history(rider_id: int) -> List[Dict]:
        """Get all completed deliveries for a rider"""
        response = supabase.table("deliveries") \
            .select("""
                id,
                order_id,
                delivered_at,
                distance_km
            """) \
            .eq("rider_id", rider_id) \
            .eq("status", "delivered") \
            .execute()
        return response.data or []
    
    @staticmethod
    def get_orders_by_ids(order_ids: List[int]) -> Dict[int, Dict]:
        """Get orders by IDs and return as a map"""
        if not order_ids:
            return {}
        response = supabase.table("orders") \
            .select("id, user_id, restaurant_id, delivery_fee_cents") \
            .in_("id", order_ids) \
            .execute()
        return {o["id"]: o for o in response.data}
    
    @staticmethod
    def get_restaurants_by_ids(restaurant_ids: List[int]) -> Dict[int, str]:
        """Get restaurant names by IDs"""
        if not restaurant_ids:
            return {}
        response = supabase.table("restaurants") \
            .select("id, name") \
            .in_("id", restaurant_ids) \
            .execute()
        return {r["id"]: r["name"] for r in response.data}
    
    @staticmethod
    def get_users_by_ids(user_ids: List[int]) -> Dict[int, str]:
        """Get user full names by IDs"""
        if not user_ids:
            return {}
        response = supabase.table("users") \
            .select("id, first_name, last_name") \
            .in_("id", user_ids) \
            .execute()
        return {u["id"]: f"{u.get('first_name','')} {u.get('last_name','')}".strip() 
                for u in response.data}
    
    @staticmethod
    def get_rider_profile(rider_id: int) -> Optional[Dict]:
        """Get rider profile with details"""
        response = supabase.table("riders") \
            .select("""
                id,
                vehicle_type,
                license_plate,
                status,
                city,
                current_latitude,
                current_longitude,
                last_location_update
            """) \
            .eq("id", rider_id) \
            .execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_rider_deliveries(rider_id: int) -> List[Dict]:
        """Get all deliveries for a rider"""
        response = supabase.table("deliveries") \
            .select("""
                id,
                order_id,
                status,
                picked_up_at,
                delivered_at,
                estimated_arrival_time
            """) \
            .eq("rider_id", rider_id) \
            .execute()
        return response.data or []
    
    @staticmethod
    def update_rider_status(rider_id: int, status: str) -> bool:
        """Update rider availability status"""
        response = supabase.table("riders") \
            .update({"status": status}) \
            .eq("id", rider_id) \
            .execute()
        return len(response.data) > 0 if response.data else False

    @staticmethod
    def update_rider_location(rider_id: int, latitude: float, longitude: float) -> bool:
        """Update rider GPS location"""
        from datetime import datetime
        response = supabase.table("riders").update({
            "current_latitude": latitude,
            "current_longitude": longitude,
            "last_location_update": datetime.utcnow().isoformat()
        }).eq("id", rider_id).execute()
        return len(response.data) > 0 if response.data else False