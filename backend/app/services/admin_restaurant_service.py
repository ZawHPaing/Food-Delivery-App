from typing import List, Optional, Dict, Any
from ..repositories.admin_restaurant_repo import RestaurantRepository
from ..models.admin_restaurant_models import (
    RestaurantCreate, RestaurantUpdate, RestaurantResponse,
    RestaurantStats
)
from datetime import datetime

class RestaurantService:
    
    @staticmethod
    async def get_all_restaurants(approved_only: bool = False) -> List[Dict]:
        """Get all restaurants"""
        try:
            restaurants = await RestaurantRepository.get_all_restaurants(approved_only)
            
            # Add metrics for each restaurant
            for r in restaurants:
                metrics = await RestaurantRepository.get_restaurant_metrics(r["id"])
                r.update(metrics)
                print(f"Restaurant {r['id']} - {r['name']}:")
                print(f"  - Menu count: {r.get('menu_count', 0)}")
                print(f"  - Order count: {r.get('order_count', 0)}")
                print(f"  - Avg rating: {r.get('average_rating', 0)}")
            
            return restaurants
        except Exception as e:
            print(f"Error in get_all_restaurants service: {e}")
            return []
    
    @staticmethod
    async def get_restaurant_by_id(restaurant_id: int) -> Optional[Dict]:
        """Get restaurant by ID with metrics"""
        try:
            restaurant = await RestaurantRepository.get_restaurant_by_id(restaurant_id)
            if not restaurant:
                return None
            
            # Get metrics
            metrics = await RestaurantRepository.get_restaurant_metrics(restaurant_id)
            restaurant.update(metrics)
            
            return restaurant
        except Exception as e:
            print(f"Error in get_restaurant_by_id service for {restaurant_id}: {e}")
            return None
    
    @staticmethod
    async def create_restaurant(restaurant_data: RestaurantCreate) -> Optional[Dict]:
        """Create a new restaurant"""
        try:
            # Create restaurant
            restaurant_dict = restaurant_data.dict()
            restaurant_dict["created_at"] = datetime.utcnow().isoformat()
            
            restaurant = await RestaurantRepository.create_restaurant(restaurant_dict)
            
            if restaurant:
                # Get metrics
                metrics = await RestaurantRepository.get_restaurant_metrics(restaurant["id"])
                restaurant.update(metrics)
            
            return restaurant
        except Exception as e:
            print(f"Error in create_restaurant service: {e}")
            return None
    
    @staticmethod
    async def update_restaurant(restaurant_id: int, restaurant_data: RestaurantUpdate) -> bool:
        """Update a restaurant"""
        try:
            update_data = {k: v for k, v in restaurant_data.dict().items() if v is not None}
            if not update_data:
                return False
            
            return await RestaurantRepository.update_restaurant(restaurant_id, update_data)
        except Exception as e:
            print(f"Error in update_restaurant service for {restaurant_id}: {e}")
            return False
    
    @staticmethod
    async def delete_restaurant(restaurant_id: int) -> bool:
        """Delete a restaurant"""
        try:
            return await RestaurantRepository.delete_restaurant(restaurant_id)
        except Exception as e:
            print(f"Error in delete_restaurant service for {restaurant_id}: {e}")
            return False
    
    @staticmethod
    async def approve_restaurant(restaurant_id: int, approve: bool = True) -> Optional[Dict]:
        """Approve or reject a restaurant"""
        try:
            success = await RestaurantRepository.approve_restaurant(restaurant_id, approve)
            if success:
                restaurant = await RestaurantRepository.get_restaurant_by_id(restaurant_id)
                if restaurant:
                    metrics = await RestaurantRepository.get_restaurant_metrics(restaurant_id)
                    restaurant.update(metrics)
                return restaurant
            return None
        except Exception as e:
            print(f"Error in approve_restaurant service for {restaurant_id}: {e}")
            return None
    
    @staticmethod
    async def get_restaurant_stats() -> Dict:
        """Get restaurant statistics"""
        try:
            stats = await RestaurantRepository.get_restaurant_stats()
            return stats
        except Exception as e:
            print(f"Error in get_restaurant_stats service: {e}")
            return {
                "total_restaurants": 0,
                "approved_restaurants": 0,
                "pending_approval": 0,
                "restaurants_by_city": {},
                "restaurants_by_cuisine": {}
            }