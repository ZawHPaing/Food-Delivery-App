from ..supabase_client import supabase
from typing import List, Dict, Any, Optional
import asyncio
from .dispatch_service import DispatchService
from ..repositories.voucher_repo import VoucherRepository
from collections import defaultdict


class ConsumerService:
    @staticmethod
    def get_restaurants(cuisine: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        if cuisine:
            try:
                relational_query = supabase.table("restaurants").select(
                    "*, restaurant_categories!inner(category_id, categories!inner(name))"
                )
                if search:
                    relational_query = relational_query.ilike("name", f"%{search}%")
                relational_query = relational_query.ilike(
                    "restaurant_categories.categories.name", f"%{cuisine}%"
                )
                response = relational_query.order("average_rating", desc=True).execute()
                if response.data:
                    return response.data
            except Exception:
                pass
            fb_query = supabase.table("restaurants").select("*").ilike("cuisine_type", f"%{cuisine}%")
            if search:
                fb_query = fb_query.ilike("name", f"%{search}%")
            fb_response = fb_query.order("average_rating", desc=True).execute()
            return fb_response.data or []

        query = supabase.table("restaurants").select("*")
        if search:
            query = query.ilike("name", f"%{search}%")
        response = query.order("average_rating", desc=True).execute()
        return response.data or []

    @staticmethod
    def get_restaurant_by_id(restaurant_id: int) -> Optional[Dict[str, Any]]:
        resp = supabase.table("restaurants").select("*").eq("id", restaurant_id).execute()
        return resp.data[0] if resp.data else None

    @staticmethod
    def get_menu_items(restaurant_id: int) -> List[Dict[str, Any]]:
        try:
            menus_resp = supabase.table("menus").select("id").eq("restaurant_id", restaurant_id).execute()
            if not menus_resp.data:
                return []
            menu_ids = [m["id"] for m in menus_resp.data]
            all_items = []
            for mid in menu_ids:
                items_resp = supabase.table("menu_items").select("*").eq("menu_id", mid).execute()
                all_items.extend(items_resp.data or [])
            return all_items
        except Exception:
            return []

    @staticmethod
    def get_popular_items() -> List[Dict[str, Any]]:
        try:
            order_items_resp = supabase.table("order_items").select(
                "menu_item_id, quantity"
            ).execute()
            order_rows = order_items_resp.data or []
            if not order_rows:
                resp = supabase.table("menu_items").select("*").limit(10).execute()
                return resp.data or []

            qty_by_item: Dict[int, int] = defaultdict(int)
            count_by_item: Dict[int, int] = defaultdict(int)
            for row in order_rows:
                menu_item_id = row.get("menu_item_id")
                if menu_item_id is None:
                    continue
                qty = int(row.get("quantity") or 0)
                qty_by_item[menu_item_id] += max(qty, 0)
                count_by_item[menu_item_id] += 1

            if not qty_by_item:
                resp = supabase.table("menu_items").select("*").limit(10).execute()
                return resp.data or []

            ranked_item_ids = sorted(
                qty_by_item.keys(),
                key=lambda item_id: (qty_by_item[item_id], count_by_item[item_id]),
                reverse=True,
            )[:10]

            items_resp = supabase.table("menu_items").select(
                "id, menu_id, name, description, price_cents, image_url, is_available"
            ).in_("id", ranked_item_ids).execute()
            items = items_resp.data or []
            if not items:
                return []

            menu_ids = list({i.get("menu_id") for i in items if i.get("menu_id") is not None})
            menu_to_restaurant: Dict[int, int] = {}
            if menu_ids:
                menus_resp = supabase.table("menus").select("id, restaurant_id").in_(
                    "id", menu_ids
                ).execute()
                for m in (menus_resp.data or []):
                    menu_to_restaurant[m["id"]] = m.get("restaurant_id")

            item_map = {item["id"]: item for item in items}
            ordered_items: List[Dict[str, Any]] = []
            for item_id in ranked_item_ids:
                item = item_map.get(item_id)
                if not item:
                    continue
                ordered_items.append({
                    **item,
                    "restaurant_id": menu_to_restaurant.get(item.get("menu_id")),
                    "total_ordered_qty": qty_by_item[item_id],
                    "order_count": count_by_item[item_id],
                })
            return ordered_items
        except Exception as e:
            return []

    @staticmethod
    def create_order(order_data: dict) -> Dict[str, Any]:
        try:
            user_email = order_data.get("email")
            user_resp = supabase.table("users").select("id").eq("email", user_email).execute()
            if user_resp.data:
                user_id = user_resp.data[0]["id"]
            else:
                new_user = {
                    "email": user_email,
                    "first_name": order_data.get("first_name"),
                    "last_name": order_data.get("last_name"),
                    "phone": order_data.get("phone"),
                    "user_type": "customer",
                    "password_hash": "guest_no_password",
                }
                new_user_resp = supabase.table("users").insert(new_user).execute()
                if not new_user_resp.data:
                    raise Exception("Failed to create guest user")
                user_id = new_user_resp.data[0]["id"]

            street = order_data.get("address_line1")
            apt = order_data.get("address_line2") or ""
            city = order_data.get("city")
            zip_code = order_data.get("postal_code")
            full_address_str = f"{street}, {apt}, {city}, {zip_code}".replace(", ,", ",")

            try:
                supabase.table("addresses").insert({
                    "user_id": user_id,
                    "street": street,
                    "city": city,
                    "state": "N/A",
                }).execute()
            except Exception:
                pass

            subtotal_cents = int(float(order_data.get("subtotal", 0)) * 100)
            tax_cents = int(float(order_data.get("tax", 0)) * 100)
            delivery_fee_cents = int(float(order_data.get("delivery_fee", 0)) * 100)
            discount_cents = 0
            voucher_code_saved = None
            restaurant_id = order_data.get("restaurant_id")
            if order_data.get("voucher_code") and str(order_data.get("voucher_code", "")).strip():
                voucher, err = VoucherRepository.validate(
                    str(order_data["voucher_code"]).strip(),
                    subtotal_cents,
                    restaurant_id,
                )
                if voucher and not err:
                    discount_cents = voucher["discount_cents"]
                    voucher_code_saved = voucher.get("code")
                    VoucherRepository.increment_use(voucher["id"])
            total_cents = max(0, subtotal_cents + tax_cents + delivery_fee_cents - discount_cents)

            # Schema: orders has no discount_cents or voucher_code; total_cents already reflects discount.
            new_order = {
                "user_id": user_id,
                "restaurant_id": restaurant_id,
                "status": "pending",
                "subtotal_cents": subtotal_cents,
                "tax_cents": tax_cents,
                "delivery_fee_cents": delivery_fee_cents,
                "total_cents": total_cents,
                "delivery_address": full_address_str,
            }
            order_resp = supabase.table("orders").insert(new_order).execute()
            if not order_resp.data:
                raise Exception("Failed to create order")
            order_id = order_resp.data[0]["id"]

            items = order_data.get("items", [])
            for item in items:
                mi_resp = supabase.table("menu_items").select("price_cents").eq(
                    "id", item["menu_item_id"]
                ).execute()
                price_cents = mi_resp.data[0]["price_cents"] if mi_resp.data else 0
                supabase.table("order_items").insert({
                    "order_id": order_id,
                    "menu_item_id": item["menu_item_id"],
                    "quantity": item["quantity"],
                    "price_cents": price_cents,
                }).execute()

            supabase.table("payments").insert({
                "order_id": order_id,
                "user_id": user_id,
                "amount_cents": total_cents,
                "payment_method": order_data.get("payment_method", "cash"),
                "status": "paid" if order_data.get("payment_method") != "cash" else "pending",
            }).execute()

            lat = order_data.get("delivery_latitude")
            lon = order_data.get("delivery_longitude")
            asyncio.create_task(DispatchService.dispatch_order(order_id, lat, lon))

            return order_resp.data[0]
        except Exception as e:
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")
