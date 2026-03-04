from typing import List, Optional, Dict, Any
from ..supabase_client import supabase

class RestaurantRepository:
    
    # Restaurant CRUD
    @staticmethod
    async def get_all_restaurants(approved_only: bool = False) -> List[Dict]:
        """Get all restaurants"""
        try:
            query = supabase.table("restaurants").select("*")
            
            if approved_only:
                query = query.eq("is_approved", True)
                
            response = query.order("name").execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting all restaurants: {e}")
            return []
    
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
    async def create_restaurant(restaurant_data: dict) -> Optional[Dict]:
        """Create a new restaurant"""
        try:
            response = supabase.table("restaurants").insert(restaurant_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating restaurant: {e}")
            return None
    
    @staticmethod
    async def update_restaurant(restaurant_id: int, restaurant_data: dict) -> bool:
        """Update restaurant"""
        try:
            response = supabase.table("restaurants") \
                .update(restaurant_data) \
                .eq("id", restaurant_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            print(f"Error updating restaurant {restaurant_id}: {e}")
            return False
    
    @staticmethod
    async def delete_restaurant(restaurant_id: int) -> bool:
        """Delete restaurant"""
        try:
            response = supabase.table("restaurants") \
                .delete() \
                .eq("id", restaurant_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            print(f"Error deleting restaurant {restaurant_id}: {e}")
            return False
    
    @staticmethod
    async def approve_restaurant(restaurant_id: int, approve: bool = True) -> bool:
        """Approve or reject restaurant"""
        try:
            response = supabase.table("restaurants") \
                .update({"is_approved": approve}) \
                .eq("id", restaurant_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            print(f"Error approving restaurant {restaurant_id}: {e}")
            return False
    
    # Statistics and counts
    @staticmethod
    async def get_restaurant_stats() -> Dict:
        """Get restaurant statistics"""
        try:
            # Get all restaurants
            all_response = supabase.table("restaurants") \
                .select("id, is_approved, city, cuisine_type") \
                .execute()
            
            restaurants = all_response.data or []
            
            # Calculate counts
            total = len(restaurants)
            approved = sum(1 for r in restaurants if r.get("is_approved", False))
            pending = total - approved
            
            # Group by city
            cities = {}
            cuisines = {}
            
            for r in restaurants:
                city = r.get("city")
                if city:
                    cities[city] = cities.get(city, 0) + 1
                else:
                    cities["Unspecified"] = cities.get("Unspecified", 0) + 1
                
                cuisine = r.get("cuisine_type")
                if cuisine:
                    cuisines[cuisine] = cuisines.get(cuisine, 0) + 1
                else:
                    cuisines["Other"] = cuisines.get("Other", 0) + 1
            
            return {
                "total_restaurants": total,
                "approved_restaurants": approved,
                "pending_approval": pending,
                "restaurants_by_city": cities,
                "restaurants_by_cuisine": cuisines
            }
        except Exception as e:
            print(f"Error getting restaurant stats: {e}")
            return {
                "total_restaurants": 0,
                "approved_restaurants": 0,
                "pending_approval": 0,
                "restaurants_by_city": {},
                "restaurants_by_cuisine": {}
            }
    
    @staticmethod
    async def get_restaurant_metrics(restaurant_id: int) -> Dict:
        """Get metrics for a specific restaurant"""
        try:
            # Get menu count - count total menu items across all menus
            menu_response = supabase.table("menus") \
                .select("id") \
                .eq("restaurant_id", restaurant_id) \
                .execute()
            
            menu_ids = [m["id"] for m in menu_response.data] if menu_response.data else []
            
            total_menu_items = 0
            if menu_ids:
                items_response = supabase.table("menu_items") \
                    .select("id", count="exact") \
                    .in_("menu_id", menu_ids) \
                    .execute()
                total_menu_items = items_response.count or 0
            
            # Get order count
            order_response = supabase.table("orders") \
                .select("id", count="exact") \
                .eq("restaurant_id", restaurant_id) \
                .execute()
            
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
    @staticmethod
    async def get_restaurant_metrics(restaurant_id: int) -> Dict:
        """Get metrics for a specific restaurant"""
        try:
            print(f"\n=== Calculating metrics for restaurant {restaurant_id} ===")
            
            # Get all menus for this restaurant
            menus_response = supabase.table("menus") \
                .select("id, name") \
                .eq("restaurant_id", restaurant_id) \
                .execute()
            
            menu_ids = [m["id"] for m in menus_response.data] if menus_response.data else []
            print(f"Found {len(menu_ids)} menus: {menu_ids}")
            
            # Count total menu items across all menus
            total_menu_items = 0
            if menu_ids:
                for menu_id in menu_ids:
                    items_response = supabase.table("menu_items") \
                        .select("id", count="exact") \
                        .eq("menu_id", menu_id) \
                        .execute()
                    item_count = items_response.count or 0
                    total_menu_items += item_count
                    print(f"  Menu {menu_id} has {item_count} items")
            
            # Get order count
            order_response = supabase.table("orders") \
                .select("id", count="exact") \
                .eq("restaurant_id", restaurant_id) \
                .execute()
            order_count = order_response.count or 0
            print(f"Found {order_count} orders")
            
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
            
            print(f"Final metrics: menu_count={total_menu_items}, order_count={order_count}, avg_rating={avg_rating}")
            print("=" * 50)
            
            return {
                "menu_count": total_menu_items,
                "order_count": order_count,
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