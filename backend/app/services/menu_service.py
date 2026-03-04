from typing import List, Optional
from ..supabase_client import supabase


class MenuService:
    @staticmethod
    def get_restaurant_id_for_menu(menu_id: int) -> Optional[int]:
        resp = supabase.table("menus").select("restaurant_id").eq("id", menu_id).maybe_single().execute()
        return resp.data.get("restaurant_id") if resp.data else None

    @staticmethod
    def get_restaurant_id_for_item(item_id: int) -> Optional[int]:
        resp = supabase.table("menu_items").select("menu_id").eq("id", item_id).maybe_single().execute()
        if not resp.data:
            return None
        return MenuService.get_restaurant_id_for_menu(resp.data["menu_id"])

    @staticmethod
    def create_menu_category(restaurant_id: int, name: str) -> Optional[dict]:
        data = {"restaurant_id": restaurant_id, "name": name}
        try:
            resp = supabase.table("menus").insert(data).execute()
            return resp.data[0] if resp.data else None
        except Exception:
            return None

    @staticmethod
    def get_menus_with_items(restaurant_id: int) -> List[dict]:
        menus_resp = supabase.table("menus").select("*").eq("restaurant_id", restaurant_id).order("id").execute()
        categories = menus_resp.data or []
        menu_ids = [c["id"] for c in categories]
        items = []
        if menu_ids:
            items_resp = supabase.table("menu_items").select("*").in_("menu_id", menu_ids).order("id").execute()
            items = items_resp.data or []
        for category in categories:
            category["items"] = [item for item in items if item["menu_id"] == category["id"]]
        return categories

    @staticmethod
    def add_menu_item(menu_id: int, item_data: dict) -> Optional[dict]:
        data = {
            "menu_id": menu_id,
            "name": item_data["name"],
            "description": item_data.get("description") or "",
            "price_cents": item_data["price_cents"],
            "is_available": item_data.get("is_available", True),
            "image_url": item_data.get("image_url"),
        }
        try:
            resp = supabase.table("menu_items").insert(data).execute()
            return resp.data[0] if resp.data else None
        except Exception:
            return None

    @staticmethod
    def update_menu_item(item_id: int, update_data: dict) -> Optional[dict]:
        cleaned = {k: v for k, v in update_data.items() if v is not None}
        if not cleaned:
            return None
        try:
            resp = supabase.table("menu_items").update(cleaned).eq("id", item_id).execute()
            return resp.data[0] if resp.data else None
        except Exception:
            return None

    @staticmethod
    def delete_menu_item(item_id: int) -> bool:
        try:
            resp = supabase.table("menu_items").delete().eq("id", item_id).execute()
            return bool(resp.data)
        except Exception:
            return False
