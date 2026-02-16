from typing import Optional
from datetime import datetime
from ..repositories.user_repo import UserRepository
from ..repositories.delivery_repo import DeliveryRepository
from ..core.security import hash_password, verify_password, create_access_token

class AuthService:
    
    @staticmethod
    def authenticate_user(email: str, password: str, expected_user_type: Optional[str] = None) -> Optional[dict]:
        """
        Authenticate a user and return token data
        If expected_user_type is provided, verify the user has that type
        """
        user = UserRepository.find_user_by_email(email)
        
        if not user:
            return None
        
        # Check if user type matches expected type (if provided)
        if expected_user_type and user["user_type"] != expected_user_type:
            return None
        
        # Verify password
        if not verify_password(password, user["password_hash"]):
            return None
        
        # Create token with user data
        token = create_access_token({
            "email": user["email"],
            "user_id": user["id"],
            "user_type": user["user_type"]
        })
        
        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "email": user["email"],
            "user_type": user["user_type"],
            "user_id": user["id"]
        }
    
    @staticmethod
    def create_user_account(signup_data: dict) -> Optional[dict]:
        """Create a new user account (any user type)"""
        
        # Check if user already exists
        existing_user = UserRepository.find_user_by_email(signup_data["email"])
        if existing_user:
            return None
        
        # Hash password
        hashed_pwd = hash_password(signup_data["password"])
        
        # Create user
        user_data = {
            "email": signup_data["email"],
            "password_hash": hashed_pwd,
            "first_name": signup_data["first_name"],
            "last_name": signup_data["last_name"],
            "phone": signup_data["phone"],
            "user_type": signup_data["user_type"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        user = UserRepository.create_user(user_data)
        if not user:
            return None
        
        # If it's a rider, create rider record
        if signup_data["user_type"] == "rider" and "vehicle" in signup_data and "license_plate" in signup_data:
            rider_data = {
                "user_id": user["id"],
                "vehicle_type": signup_data["vehicle"],
                "license_plate": signup_data["license_plate"],
                "status": "inactive",
                "current_latitude": None,
                "current_longitude": None,
                "last_location_update": None,
                "city": signup_data.get("city", "")
            }
            DeliveryRepository.create_rider(rider_data)
        
        token = create_access_token({
            "email": user["email"],
            "user_id": user["id"],
            "user_type": user["user_type"]
        })
        
        return {
            "message": f"{signup_data['user_type'].capitalize()} signup successful!",
            "user": user,
            "access_token": token
        }