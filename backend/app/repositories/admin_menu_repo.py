from typing import List, Optional, Dict, Any
from ..supabase_client import supabase

class MenuRepository:
    
    # Restaurant methods
    @staticmethod
    async def get_restaurant_by_id(restaurant_id: int) -> Optional[Dict]:
        """Get restaurant by ID"""
        try:
            response = supabase.table("restaurants") \
                .select("*") \
                .eq("id", restaurant_id) \
                .single() \
                .execute()
            return response.data if response.data else None
        except Exception as e:
            print(f"Error getting restaurant by ID {restaurant_id}: {e}")
            return None
    
    @staticmethod
    async def get_restaurant_by_user_id(user_id: int) -> Optional[Dict]:
        """Get restaurant owned by user"""
        try:
            response = supabase.table("restaurants") \
                .select("*") \
                .eq("user_id", user_id) \
                .single() \
                .execute()
            return response.data if response.data else None
        except Exception as e:
            print(f"Error getting restaurant by user ID {user_id}: {e}")
            return None
    
    # Menu methods
    @staticmethod
    async def get_menus_by_restaurant(restaurant_id: int) -> List[Dict]:
        """Get all menus for a restaurant"""
        try:
            response = supabase.table("menus") \
                .select("*") \
                .eq("restaurant_id", restaurant_id) \
                .order("id") \
                .execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting menus for restaurant {restaurant_id}: {e}")
            return []
    
    @staticmethod
    async def get_menu_by_id(menu_id: int) -> Optional[Dict]:
        """Get menu by ID"""
        try:
            response = supabase.table("menus") \
                .select("*") \
                .eq("id", menu_id) \
                .single() \
                .execute()
            return response.data if response.data else None
        except Exception as e:
            print(f"Error getting menu by ID {menu_id}: {e}")
            return None
    
    @staticmethod
    async def create_menu(menu_data: dict) -> Optional[Dict]:
        """Create a new menu"""
        try:
            response = supabase.table("menus").insert(menu_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating menu: {e}")
            return None
    
    @staticmethod
    async def update_menu(menu_id: int, menu_data: dict) -> bool:
        """Update menu"""
        try:
            response = supabase.table("menus") \
                .update(menu_data) \
                .eq("id", menu_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            print(f"Error updating menu {menu_id}: {e}")
            return False
    
    @staticmethod
    async def delete_menu(menu_id: int) -> bool:
        """Delete menu"""
        try:
            response = supabase.table("menus") \
                .delete() \
                .eq("id", menu_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            print(f"Error deleting menu {menu_id}: {e}")
            return False
    
    # Menu Items methods
    @staticmethod
    async def get_menu_items(menu_id: int) -> List[Dict]:
        """Get all items for a menu"""
        try:
            response = supabase.table("menu_items") \
                .select("*") \
                .eq("menu_id", menu_id) \
                .order("id") \
                .execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting menu items for menu {menu_id}: {e}")
            return []
    
    @staticmethod
    async def get_menu_item_by_id(item_id: int) -> Optional[Dict]:
        """Get menu item by ID"""
        try:
            response = supabase.table("menu_items") \
                .select("*") \
                .eq("id", item_id) \
                .single() \
                .execute()
            return response.data if response.data else None
        except Exception as e:
            print(f"Error getting menu item by ID {item_id}: {e}")
            return None
    
    @staticmethod
    async def create_menu_item(item_data: dict) -> Optional[Dict]:
        """Create a new menu item"""
        try:
            response = supabase.table("menu_items").insert(item_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating menu item: {e}")
            return None
    
    @staticmethod
    async def create_menu_items_bulk(items_data: List[dict]) -> List[Dict]:
        """Create multiple menu items"""
        try:
            response = supabase.table("menu_items").insert(items_data).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"Error bulk creating menu items: {e}")
            return []
    
    @staticmethod
    async def update_menu_item(item_id: int, item_data: dict) -> bool:
        """Update menu item"""
        try:
            response = supabase.table("menu_items") \
                .update(item_data) \
                .eq("id", item_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            print(f"Error updating menu item {item_id}: {e}")
            return False
    
    @staticmethod
    async def delete_menu_item(item_id: int) -> bool:
        """Delete menu item"""
        try:
            response = supabase.table("menu_items") \
                .delete() \
                .eq("id", item_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            print(f"Error deleting menu item {item_id}: {e}")
            return False
    
    # Categories methods
    @staticmethod
    async def get_all_categories() -> List[Dict]:
        """Get all categories"""
        try:
            response = supabase.table("categories") \
                .select("*") \
                .order("name") \
                .execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting all categories: {e}")
            return []

    @staticmethod
    async def get_category_by_id(category_id: int) -> Optional[Dict]:
        """Get category by ID"""
        try:
            response = supabase.table("categories") \
                .select("*") \
                .eq("id", category_id) \
                .maybe_single() \
                .execute()
            return response.data if response.data else None
        except Exception as e:
            print(f"Error getting category by ID {category_id}: {e}")
            return None

    @staticmethod
    async def get_category_by_name(name: str) -> Optional[Dict]:
        """Get category by name"""
        try:
            response = supabase.table("categories") \
                .select("*") \
                .eq("name", name) \
                .maybe_single() \
                .execute()
            return response.data if response.data else None
        except Exception as e:
            print(f"Error getting category by name {name}: {e}")
            return None

    @staticmethod
    async def create_category(category_data: dict) -> Optional[Dict]:
        """Create a new category"""
        try:
            print(f"Creating category with data: {category_data}")
            
            # First check if category already exists
            existing = await MenuRepository.get_category_by_name(category_data.get('name'))
            if existing:
                print(f"Category already exists: {existing}")
                return existing
            
            # Insert the category
            response = supabase.table("categories").insert(category_data).execute()
            
            # Log the response for debugging
            print(f"Insert response: {response}")
            print(f"Response data: {response.data}")
            
            # Check if we got data back
            if response.data and len(response.data) > 0:
                return response.data[0]
            
            # If no data returned but we think it might have worked,
            # try to fetch the newly created category
            if response.data is None or len(response.data) == 0:
                print("No data returned from insert, attempting to fetch by name...")
                name = category_data.get('name')
                if name:
                    # Wait a moment for the database to complete the insert
                    import asyncio
                    await asyncio.sleep(0.5)
                    
                    fetch_response = supabase.table("categories") \
                        .select("*") \
                        .eq("name", name) \
                        .maybe_single() \
                        .execute()
                    
                    if fetch_response.data:
                        print(f"Found category after insert: {fetch_response.data}")
                        return fetch_response.data
            
            return None
        except Exception as e:
            print(f"Error creating category: {e}")
            return None

    @staticmethod
    async def delete_category(category_id: int) -> bool:
        """Delete category"""
        try:
            # First check if category exists
            existing = await MenuRepository.get_category_by_id(category_id)
            if not existing:
                print(f"Category {category_id} not found")
                return False
            
            # Delete the category
            response = supabase.table("categories") \
                .delete() \
                .eq("id", category_id) \
                .execute()
            
            # Check if deletion was successful
            success = response.data is not None and len(response.data) > 0
            print(f"Delete category {category_id}: success={success}")
            return success
        except Exception as e:
            print(f"Error deleting category {category_id}: {e}")
            return False
    
    # Menu Item Categories junction methods
    @staticmethod
    async def get_categories_for_item(menu_item_id: int) -> List[Dict]:
        """Get all categories for a menu item"""
        try:
            response = supabase.table("menu_item_categories") \
                .select("category_id, categories(*)") \
                .eq("menu_item_id", menu_item_id) \
                .execute()
            
            if response.data:
                return [item["categories"] for item in response.data if item.get("categories")]
            return []
        except Exception as e:
            print(f"Error getting categories for item {menu_item_id}: {e}")
            return []
    
    @staticmethod
    async def assign_categories_to_item(menu_item_id: int, category_ids: List[int]) -> bool:
        """Assign categories to a menu item"""
        try:
            # First, delete existing assignments
            supabase.table("menu_item_categories") \
                .delete() \
                .eq("menu_item_id", menu_item_id) \
                .execute()
            
            # Then insert new ones
            if category_ids:
                assignments = [{"menu_item_id": menu_item_id, "category_id": cat_id} 
                              for cat_id in category_ids]
                response = supabase.table("menu_item_categories").insert(assignments).execute()
                success = len(response.data) == len(category_ids) if response.data else False
                print(f"Assigned {len(category_ids)} categories to item {menu_item_id}: success={success}")
                return success
            return True
        except Exception as e:
            print(f"Error assigning categories to item {menu_item_id}: {e}")
            return False
    @staticmethod
    async def get_restaurant_metrics(restaurant_id: int) -> Dict:
        """Get metrics for a specific restaurant"""
        try:
            print(f"Getting metrics for restaurant {restaurant_id}")
            
            # Get all menus for this restaurant
            menus_response = supabase.table("menus") \
                .select("id") \
                .eq("restaurant_id", restaurant_id) \
                .execute()
            
            menu_ids = [m["id"] for m in menus_response.data] if menus_response.data else []
            print(f"Found {len(menu_ids)} menus for restaurant {restaurant_id}")
            
            # Count total menu items across all menus
            total_menu_items = 0
            if menu_ids:
                # For each menu, count its items
                for menu_id in menu_ids:
                    items_response = supabase.table("menu_items") \
                        .select("id", count="exact") \
                        .eq("menu_id", menu_id) \
                        .execute()
                    total_menu_items += items_response.count or 0
                    print(f"  Menu {menu_id} has {items_response.count or 0} items")
            
            # Get order count
            order_response = supabase.table("orders") \
                .select("id", count="exact") \
                .eq("restaurant_id", restaurant_id) \
                .execute()
            print(f"Found {order_response.count or 0} orders for restaurant {restaurant_id}")
            
            # Get average rating
            review_response = supabase.table("reviews") \
                .select("rating") \
                .eq("restaurant_id", restaurant_id) \
                .execute()
            
            avg_rating = 0
            total_reviews = 0
            if review_response.data:
                ratings = [r.get("rating", 0) for r in review_response.data if r.get("rating")]
                total_reviews = len(ratings)
                avg_rating = sum(ratings) / total_reviews if ratings else 0
                print(f"Found {total_reviews} reviews, avg rating: {avg_rating}")
            
            return {
                "menu_count": total_menu_items,
                "order_count": order_response.count or 0,
                "average_rating": round(avg_rating, 1),
                "total_reviews": total_reviews
            }
        except Exception as e:
            print(f"Error getting restaurant metrics for {restaurant_id}: {e}")
            return {
                "menu_count": 0,
                "order_count": 0,
                "average_rating": 0,
                "total_reviews": 0
            }