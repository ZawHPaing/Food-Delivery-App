from typing import List, Optional, Dict
from datetime import datetime
from ..supabase_client import supabase


class CustomerRepository:
    """Repository for customer module: addresses, payments, orders, order_items, reviews, notifications.
    Matches Supabase schema: no customers/carts tables; payments are per-order; orders use delivery_address text."""

    # ----- Addresses (street, city, state, postal_code, country, label, latitude, longitude, is_default) -----
    @staticmethod
    def get_addresses_by_user_id(user_id: int) -> List[Dict]:
        response = supabase.table("addresses") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("is_default", desc=True) \
            .execute()
        return response.data or []

    @staticmethod
    def get_address_by_id(address_id: int, user_id: int) -> Optional[Dict]:
        response = supabase.table("addresses") \
            .select("*") \
            .eq("id", address_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        return response.data

    @staticmethod
    def create_address(user_id: int, data: dict) -> Optional[Dict]:
        data["user_id"] = user_id
        if data.get("is_default"):
            supabase.table("addresses").update({"is_default": False}).eq("user_id", user_id).execute()
        response = supabase.table("addresses").insert(data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def update_address(address_id: int, user_id: int, data: dict) -> Optional[Dict]:
        if data.get("is_default") is True:
            supabase.table("addresses").update({"is_default": False}).eq("user_id", user_id).execute()
        response = supabase.table("addresses").update(data).eq("id", address_id).eq("user_id", user_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def delete_address(address_id: int, user_id: int) -> bool:
        response = supabase.table("addresses").delete().eq("id", address_id).eq("user_id", user_id).execute()
        return response.count > 0

    # ----- Payments (per order: order_id, user_id, status, amount_cents, payment_method, transaction_id, paid_at) -----
    @staticmethod
    def get_payments_by_user_id(user_id: int) -> List[Dict]:
        response = supabase.table("payments") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        return response.data or []

    @staticmethod
    def get_payment_by_id(payment_id: int, user_id: int) -> Optional[Dict]:
        response = supabase.table("payments") \
            .select("*") \
            .eq("id", payment_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        return response.data

    @staticmethod
    def create_payment_for_order(order_id: int, user_id: int, amount_cents: int, payment_method: str, status: str = "paid") -> Optional[Dict]:
        data = {
            "order_id": order_id,
            "user_id": user_id,
            "amount_cents": amount_cents,
            "payment_method": payment_method,
            "status": status,
            "paid_at": datetime.utcnow().isoformat(),
        }
        response = supabase.table("payments").insert(data).execute()
        return response.data[0] if response.data else None

    # ----- Orders (status, subtotal_cents, tax_cents, delivery_fee_cents, total_cents, delivery_address) -----
    @staticmethod
    def create_order(user_id: int, data: dict) -> Optional[Dict]:
        data["user_id"] = user_id
        data.setdefault("status", "pending")
        data.setdefault("created_at", datetime.utcnow().isoformat())
        data.setdefault("updated_at", datetime.utcnow().isoformat())
        response = supabase.table("orders").insert(data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def create_order_item(order_id: int, menu_item_id: int, quantity: int, price_cents: int, special_instructions: Optional[str] = None) -> Optional[Dict]:
        data = {
            "order_id": order_id,
            "menu_item_id": menu_item_id,
            "quantity": quantity,
            "price_cents": price_cents,
        }
        if special_instructions is not None:
            data["special_instructions"] = special_instructions
        response = supabase.table("order_items").insert(data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_orders_by_user_id(user_id: int) -> List[Dict]:
        response = supabase.table("orders") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        return response.data or []

    @staticmethod
    def get_order_by_id(order_id: int, user_id: int) -> Optional[Dict]:
        response = supabase.table("orders") \
            .select("*") \
            .eq("id", order_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        return response.data

    @staticmethod
    def get_order_items(order_id: int) -> List[Dict]:
        response = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        return response.data or []

    @staticmethod
    def get_restaurant_by_id(restaurant_id: int) -> Optional[Dict]:
        response = supabase.table("restaurants").select("id, name").eq("id", restaurant_id).maybe_single().execute()
        return response.data

    @staticmethod
    def get_menu_items_by_ids(menu_item_ids: List[int]) -> Dict[int, Dict]:
        if not menu_item_ids:
            return {}
        response = supabase.table("menu_items").select("id, name, price_cents").in_("id", menu_item_ids).execute()
        return {m["id"]: m for m in (response.data or [])}

    # ----- Reviews (order_id, reviewer_id, restaurant_id, rating, comment) -----
    @staticmethod
    def create_review(reviewer_id: int, restaurant_id: int, rating: int, comment: str, order_id: Optional[int] = None) -> Optional[Dict]:
        data = {
            "reviewer_id": reviewer_id,
            "restaurant_id": restaurant_id,
            "rating": rating,
            "comment": comment,
        }
        if order_id is not None:
            data["order_id"] = order_id
        response = supabase.table("reviews").insert(data).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_reviews_by_reviewer_id(reviewer_id: int) -> List[Dict]:
        response = supabase.table("reviews") \
            .select("*") \
            .eq("reviewer_id", reviewer_id) \
            .execute()
        return response.data or []

    @staticmethod
    def get_reviews_by_restaurant_id(restaurant_id: int) -> List[Dict]:
        response = supabase.table("reviews") \
            .select("*") \
            .eq("restaurant_id", restaurant_id) \
            .execute()
        return response.data or []

    # ----- Notifications (type, title, message, channel, body, sent_at) -----
    @staticmethod
    def get_notifications_by_user_id(user_id: int, limit: int = 50) -> List[Dict]:
        response = supabase.table("notifications") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("sent_at", desc=True) \
            .limit(limit) \
            .execute()
        return response.data or []
