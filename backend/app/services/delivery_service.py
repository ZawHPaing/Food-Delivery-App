from typing import List, Optional
from ..repositories.delivery_repo import DeliveryRepository
from ..models.delivery_models import DeliveryHistoryItem, RiderProfileResponse
from ..core.security import hash_password, verify_password, create_access_token

class DeliveryService:
    
    @staticmethod
    def authenticate_rider(email: str, password: str) -> Optional[dict]:
        """Authenticate a rider and return token data"""
        user = DeliveryRepository.find_user_by_email(email)
        
        if not user or user["user_type"] != "rider":
            return None
        
        if not verify_password(password, user["password_hash"]):
            return None
        
        token = create_access_token({"email": user["email"]})
        
        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "email": user["email"]
        }
    
    @staticmethod
    def create_rider_account(signup_data: dict) -> Optional[dict]:
        """Create a new rider account"""
        from datetime import datetime
        
        # Hash password
        hashed_pwd = hash_password(signup_data["password"])
        
        # Create user
        user_data = {
            "email": signup_data["email"],
            "password_hash": hashed_pwd,
            "first_name": signup_data["first_name"],
            "last_name": signup_data["last_name"],
            "phone": signup_data["phone"],
            "user_type": "rider",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        user = DeliveryRepository.create_user(user_data)
        if not user:
            return None
        
        # Create rider
        rider_data = {
            "user_id": user["id"],
            "vehicle_type": signup_data["vehicle"],
            "license_plate": signup_data["license_plate"],
            "status": "inactive",
            "current_latitude": None,
            "current_longitude": None,
            "last_location_update": None,
            "city": signup_data["city"]
        }
        
        rider = DeliveryRepository.create_rider(rider_data)
        if not rider:
            return None
        
        token = create_access_token({"email": user["email"]})
        
        return {
            "message": "Rider signup successful!",
            "user": user,
            "rider": rider,
            "access_token": token
        }
    
    @staticmethod
    def get_delivery_history(rider_id: int) -> List[DeliveryHistoryItem]:
        """Get formatted delivery history for a rider"""
        # Get deliveries
        deliveries = DeliveryRepository.get_delivery_history(rider_id)
        if not deliveries:
            return []
        
        # Get related data
        order_ids = [d["order_id"] for d in deliveries]
        orders = DeliveryRepository.get_orders_by_ids(order_ids)
        
        restaurant_ids = list({o.get("restaurant_id") for o in orders.values() if o.get("restaurant_id")})
        restaurants = DeliveryRepository.get_restaurants_by_ids(restaurant_ids)
        
        user_ids = list({o.get("user_id") for o in orders.values() if o.get("user_id")})
        users = DeliveryRepository.get_users_by_ids(user_ids)
        
        # Build history items
        history = []
        for d in deliveries:
            order = orders.get(d["order_id"], {})
            history.append(DeliveryHistoryItem(
                id=d["id"],
                restaurant_name=restaurants.get(order.get("restaurant_id"), "Unknown"),
                customer_name=users.get(order.get("user_id"), "Unknown"),
                earnings_cents=order.get("delivery_fee_cents", 0),
                delivered_at=d.get("delivered_at"),
                distance_km=d.get("distance_km", 0.0)
            ))
        
        return history
    
    @staticmethod
    def get_rider_profile(user: dict) -> dict:
        """Get complete rider profile with deliveries"""
        rider = DeliveryRepository.get_rider_by_user_id(user["id"])
        deliveries = []
        
        if rider:
            deliveries = DeliveryRepository.get_rider_deliveries(rider["id"])
            
            if deliveries:
                order_ids = [d["order_id"] for d in deliveries]
                orders = DeliveryRepository.get_orders_by_ids(order_ids)
                
                # Add delivery fee to each delivery
                for d in deliveries:
                    d["delivery_fee_cents"] = orders.get(d["order_id"], {}).get("delivery_fee_cents", 0)
        
        return {
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "rider": rider,
            "deliveries": deliveries
        }
    
    @staticmethod
    def update_rider_status(rider_id: int, status: str) -> bool:
        """Update rider status"""
        if status not in ["available", "unavailable"]:
            return False
        return DeliveryRepository.update_rider_status(rider_id, status)