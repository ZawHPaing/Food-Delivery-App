from typing import List, Optional, Dict
from datetime import datetime
from ..supabase_client import supabase


def _safe_data(response, default=None):
    """Avoid 'NoneType' object has no attribute 'data' when Supabase execute() fails or returns None."""
    if response is None:
        return default
    data = getattr(response, "data", None)
    return data if data is not None else default


def _normalize_address_row(row: Dict) -> Dict:
    """Map DB columns to backend shape: address_line1 -> street if needed."""
    if row is None:
        return row
    out = dict(row)
    if "street" not in out and "address_line1" in out:
        out["street"] = out.get("address_line1")
    return out


def _normalize_review_row(row: Dict) -> Dict:
    """Map DB user_id -> reviewer_id for response models."""
    if row is None:
        return row
    out = dict(row)
    if "reviewer_id" not in out and "user_id" in out:
        out["reviewer_id"] = out.get("user_id")
    return out


def _normalize_notification_row(row: Dict) -> Dict:
    """Map created_at -> sent_at if sent_at missing."""
    if row is None:
        return row
    out = dict(row)
    if "sent_at" not in out and "created_at" in out:
        out["sent_at"] = out.get("created_at")
    return out


class CustomerRepository:
    """Repository for customer module. Reads/writes directly to Supabase public schema:
    addresses, payments, orders, order_items, reviews, notifications, restaurants, menu_items, users.
    Column names match your Supabase schema (street, reviewer_id, price_cents, sent_at, etc.)."""

    # ----- Addresses (street, city, state, postal_code, country, label, latitude, longitude, is_default) -----
    @staticmethod
    def get_addresses_by_user_id(user_id: int) -> List[Dict]:
        response = supabase.table("addresses") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("is_default", desc=True) \
            .execute()
        return [_normalize_address_row(r) for r in (_safe_data(response) or [])]

    @staticmethod
    def get_address_by_id(address_id: int, user_id: int) -> Optional[Dict]:
        response = supabase.table("addresses") \
            .select("*") \
            .eq("id", address_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        return _normalize_address_row(row) if (row := _safe_data(response)) is not None else None

    _ADDRESS_COLUMNS = {"user_id", "street", "city", "state", "postal_code", "country", "label", "latitude", "longitude", "is_default"}

    @staticmethod
    def create_address(user_id: int, data: dict) -> Optional[Dict]:
        payload = {k: v for k, v in data.items() if k in CustomerRepository._ADDRESS_COLUMNS}
        payload["user_id"] = user_id
        if payload.get("is_default"):
            supabase.table("addresses").update({"is_default": False}).eq("user_id", user_id).execute()
        response = supabase.table("addresses").insert(payload).execute()
        data = _safe_data(response)
        row = data[0] if data else None
        return _normalize_address_row(row)

    @staticmethod
    def update_address(address_id: int, user_id: int, data: dict) -> Optional[Dict]:
        payload = {k: v for k, v in data.items() if k in CustomerRepository._ADDRESS_COLUMNS}
        if payload.get("is_default") is True:
            supabase.table("addresses").update({"is_default": False}).eq("user_id", user_id).execute()
        response = supabase.table("addresses").update(payload).eq("id", address_id).eq("user_id", user_id).execute()
        data = _safe_data(response)
        row = data[0] if data else None
        return _normalize_address_row(row)

    @staticmethod
    def delete_address(address_id: int, user_id: int) -> bool:
        try:
            response = supabase.table("addresses").delete().eq("id", address_id).eq("user_id", user_id).execute()
            count = getattr(response, "count", None)
            if count is not None:
                return count > 0
            data = _safe_data(response)
            if data is not None:
                return len(data) > 0
            return True
        except Exception:
            return False

    # ----- Payments (per order: order_id, user_id, status, amount_cents, payment_method, transaction_id, paid_at) -----
    @staticmethod
    def get_payments_by_user_id(user_id: int) -> List[Dict]:
        response = supabase.table("payments") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        return _safe_data(response) or []

    @staticmethod
    def get_payment_by_id(payment_id: int, user_id: int) -> Optional[Dict]:
        response = supabase.table("payments") \
            .select("*") \
            .eq("id", payment_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        return _safe_data(response)

    @staticmethod
    def get_payments_by_order_ids(order_ids: list) -> Dict[int, Dict]:
        """Return map order_id -> payment row (payment_method, amount_cents, status) for COD/rider cash."""
        if not order_ids:
            return {}
        response = supabase.table("payments") \
            .select("order_id, payment_method, amount_cents, status") \
            .in_("order_id", order_ids) \
            .execute()
        data = _safe_data(response) or []
        return {int(p["order_id"]): p for p in data}

    @staticmethod
    def mark_payment_paid_for_order(order_id: int) -> bool:
        """Mark payment as paid (for COD when rider marks delivered)."""
        from datetime import datetime
        try:
            response = supabase.table("payments") \
                .update({"status": "paid", "paid_at": datetime.utcnow().isoformat()}) \
                .eq("order_id", order_id) \
                .execute()
            data = _safe_data(response)
            return bool(data and len(data) > 0)
        except Exception:
            return False

    @staticmethod
    def create_payment_for_order(order_id: int, user_id: int, amount_cents: int, payment_method: str, status: str = "paid") -> Optional[Dict]:
        data = {
            "order_id": order_id,
            "user_id": user_id,
            "amount_cents": amount_cents,
            "payment_method": payment_method,
            "status": status,
        }
        if status == "paid":
            data["paid_at"] = datetime.utcnow().isoformat()
        response = supabase.table("payments").insert(data).execute()
        d = _safe_data(response)
        return d[0] if d else None

    # ----- Orders (public.orders: user_id, restaurant_id, status, subtotal_cents, tax_cents, delivery_fee_cents, total_cents, delivery_address; created_at/updated_at from DB default) -----
    @staticmethod
    def create_order(user_id: int, data: dict) -> Optional[Dict]:
        payload = {
            "user_id": user_id,
            "restaurant_id": data.get("restaurant_id"),
            "status": data.get("status", "pending"),
            "subtotal_cents": data.get("subtotal_cents", 0),
            "tax_cents": data.get("tax_cents", 0),
            "delivery_fee_cents": data.get("delivery_fee_cents", 0),
            "total_cents": data.get("total_cents", 0),
            "delivery_address": data.get("delivery_address"),
        }
        # Not persisting discount_cents/voucher_code — current DB schema has no these columns.
        # total_cents already reflects any discount.
        response = supabase.table("orders").insert(payload).execute()
        d = _safe_data(response)
        return d[0] if d else None

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
        d = _safe_data(response)
        return d[0] if d else None

    @staticmethod
    def get_orders_by_user_id(user_id: int) -> List[Dict]:
        response = supabase.table("orders") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        return _safe_data(response) or []

    @staticmethod
    def get_order_by_id(order_id: int, user_id: int) -> Optional[Dict]:
        response = supabase.table("orders") \
            .select("*") \
            .eq("id", order_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        return _safe_data(response)

    @staticmethod
    def get_order_tracking(order_id: int, user_id: int) -> Optional[Dict]:
        """Full order details for tracking: order, restaurant, items, delivery, rider."""
        order_resp = supabase.table("orders").select("*").eq("id", order_id).eq("user_id", user_id).maybe_single().execute()
        order = _safe_data(order_resp)
        if not order:
            return None
        rid = order.get("restaurant_id")
        if rid:
            rest = supabase.table("restaurants").select("id, name").eq("id", rid).maybe_single().execute()
            order["restaurants"] = _safe_data(rest) or {}
        items_resp = supabase.table("order_items").select("*, menu_items(name, image_url)").eq("order_id", order_id).execute()
        order["items"] = _safe_data(items_resp) or []
        delivery_resp = supabase.table("deliveries").select("*").eq("order_id", order_id).execute()
        delivery_data = _safe_data(delivery_resp)
        if delivery_data:
            order["delivery"] = delivery_data[0]
            rider_id = order["delivery"].get("rider_id")
            if rider_id:
                rider_resp = supabase.table("riders").select("*, users(first_name, last_name, phone)").eq("id", rider_id).maybe_single().execute()
                order["rider"] = _safe_data(rider_resp)
        return order

    @staticmethod
    def get_order_items(order_id: int) -> List[Dict]:
        response = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        return _safe_data(response) or []

    @staticmethod
    def get_restaurant_by_id(restaurant_id: int) -> Optional[Dict]:
        response = supabase.table("restaurants").select("id, name").eq("id", restaurant_id).maybe_single().execute()
        return _safe_data(response)

    # ----- Public: list restaurants and restaurant with menu (for customer app browsing) -----
    @staticmethod
    def get_restaurants_list() -> List[Dict]:
        """List restaurants (id, name, description, city, cuisine_type, average_rating, total_reviews)."""
        response = supabase.table("restaurants") \
            .select("id, name, description, city, cuisine_type, average_rating, total_reviews") \
            .execute()
        return _safe_data(response) or []

    @staticmethod
    def get_restaurant_with_menu(restaurant_id: int) -> Optional[Dict]:
        """Get one restaurant and its menu items (via menus). Returns restaurant + menus with items."""
        restaurant_resp = supabase.table("restaurants") \
            .select("*") \
            .eq("id", restaurant_id) \
            .maybe_single() \
            .execute()
        restaurant = _safe_data(restaurant_resp)
        if not restaurant:
            return None
        menus_resp = supabase.table("menus") \
            .select("id, name, restaurant_id") \
            .eq("restaurant_id", restaurant_id) \
            .execute()
        menu_ids = [m["id"] for m in (_safe_data(menus_resp) or [])]
        if not menu_ids:
            return {**restaurant, "menus": [], "menu_items": []}
        items_resp = supabase.table("menu_items") \
            .select("id, menu_id, name, description, price_cents, is_available, image_url") \
            .in_("menu_id", menu_ids) \
            .execute()
        items_list = _safe_data(items_resp) or []
        return {
            **restaurant,
            "menus": _safe_data(menus_resp) or [],
            "menu_items": items_list,
        }

    @staticmethod
    def get_menu_items_by_ids(menu_item_ids: List[int]) -> Dict[int, Dict]:
        if not menu_item_ids:
            return {}
        response = supabase.table("menu_items").select("id, name, price_cents").in_("id", menu_item_ids).execute()
        return {m["id"]: m for m in (_safe_data(response) or [])}

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
        d = _safe_data(response)
        row = d[0] if d else None
        return _normalize_review_row(row) if row else None

    @staticmethod
    def get_reviews_by_reviewer_id(reviewer_id: int) -> List[Dict]:
        response = supabase.table("reviews") \
            .select("*") \
            .eq("reviewer_id", reviewer_id) \
            .execute()
        data = _safe_data(response)
        if data:
            return [_normalize_review_row(r) for r in data]
        return []

    @staticmethod
    def get_reviews_by_restaurant_id(restaurant_id: int) -> List[Dict]:
        response = supabase.table("reviews") \
            .select("*") \
            .eq("restaurant_id", restaurant_id) \
            .execute()
        data = _safe_data(response)
        if data:
            return [_normalize_review_row(r) for r in data]
        return []

    # ----- Notifications (type, title, message, channel, body, sent_at) -----
    @staticmethod
    def get_notifications_by_user_id(user_id: int, limit: int = 50) -> List[Dict]:
        response = supabase.table("notifications") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("sent_at", desc=True) \
            .limit(limit) \
            .execute()
        data = _safe_data(response) or []
        return [_normalize_notification_row(r) for r in data]
