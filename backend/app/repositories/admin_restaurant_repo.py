from typing import List, Optional, Dict, Any
from ..supabase_client import supabase
from collections import defaultdict

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
    async def get_bulk_restaurant_metrics(restaurant_ids: List[int]) -> Dict[int, Dict]:
        """
        Get metrics for multiple restaurants in just 3-4 queries instead of N*4 queries.
        Returns a dictionary mapping restaurant_id to metrics.
        """
        if not restaurant_ids:
            return {}
        
        try:
            print(f"\n=== Calculating bulk metrics for {len(restaurant_ids)} restaurants ===")
            
            # ===== 1. Get menu item counts per restaurant in one query =====
            # First, get all menus for these restaurants
            menus_response = supabase.table("menus") \
                .select("id, restaurant_id") \
                .in_("restaurant_id", restaurant_ids) \
                .execute()
            
            menus = menus_response.data or []
            
            # Group menu_ids by restaurant_id
            restaurant_to_menu_ids = defaultdict(list)
            all_menu_ids = []
            
            for menu in menus:
                restaurant_id = menu["restaurant_id"]
                menu_id = menu["id"]
                restaurant_to_menu_ids[restaurant_id].append(menu_id)
                all_menu_ids.append(menu_id)
            
            # Get item counts per menu (one query)
            menu_item_counts = defaultdict(int)
            if all_menu_ids:
                # Using count with group by would be ideal, but Supabase's count in select works differently
                # Alternative: get all items and count them manually
                items_response = supabase.table("menu_items") \
                    .select("menu_id") \
                    .in_("menu_id", all_menu_ids) \
                    .execute()
                
                items = items_response.data or []
                for item in items:
                    menu_item_counts[item["menu_id"]] += 1
            
            # Aggregate item counts per restaurant
            restaurant_menu_counts = defaultdict(int)
            for restaurant_id, menu_ids in restaurant_to_menu_ids.items():
                total_items = sum(menu_item_counts.get(menu_id, 0) for menu_id in menu_ids)
                restaurant_menu_counts[restaurant_id] = total_items
            
            # ===== 2. Get order counts per restaurant (one query) =====
            orders_response = supabase.table("orders") \
                .select("restaurant_id") \
                .in_("restaurant_id", restaurant_ids) \
                .execute()
            
            orders = orders_response.data or []
            restaurant_order_counts = defaultdict(int)
            for order in orders:
                restaurant_order_counts[order["restaurant_id"]] += 1
            
            # ===== 3. Get review stats per restaurant (one query) =====
            reviews_response = supabase.table("reviews") \
                .select("restaurant_id, rating") \
                .in_("restaurant_id", restaurant_ids) \
                .execute()
            
            reviews = reviews_response.data or []
            
            # Group ratings by restaurant
            restaurant_ratings = defaultdict(list)
            for review in reviews:
                restaurant_ratings[review["restaurant_id"]].append(review["rating"])
            
            # Calculate averages
            restaurant_avg_ratings = {}
            restaurant_review_counts = {}
            
            for restaurant_id, ratings in restaurant_ratings.items():
                restaurant_review_counts[restaurant_id] = len(ratings)
                restaurant_avg_ratings[restaurant_id] = sum(ratings) / len(ratings) if ratings else 0
            
            # ===== 4. Build metrics for all restaurants =====
            metrics = {}
            for restaurant_id in restaurant_ids:
                metrics[restaurant_id] = {
                    "menu_count": restaurant_menu_counts.get(restaurant_id, 0),
                    "order_count": restaurant_order_counts.get(restaurant_id, 0),
                    "average_rating": round(restaurant_avg_ratings.get(restaurant_id, 0), 1),
                    "total_reviews": restaurant_review_counts.get(restaurant_id, 0)
                }
            
            # Print summary
            print(f"Bulk metrics complete: {len(restaurant_ids)} restaurants processed in 3 queries")
            for rid, m in list(metrics.items())[:3]:  # Show first 3 as sample
                print(f"  Restaurant {rid}: menu_count={m['menu_count']}, orders={m['order_count']}, rating={m['average_rating']}")
            
            return metrics
            
        except Exception as e:
            print(f"Error in bulk restaurant metrics: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    # Keep single restaurant version for backward compatibility
    @staticmethod
    async def get_restaurant_metrics(restaurant_id: int) -> Dict:
        """Get metrics for a specific restaurant (uses bulk method internally)"""
        try:
            result = await RestaurantRepository.get_bulk_restaurant_metrics([restaurant_id])
            return result.get(restaurant_id, {
                "menu_count": 0,
                "order_count": 0,
                "average_rating": 0,
                "total_reviews": 0
            })
        except Exception as e:
            print(f"Error getting restaurant metrics for {restaurant_id}: {e}")
            return {
                "menu_count": 0,
                "order_count": 0,
                "average_rating": 0,
                "total_reviews": 0
            }