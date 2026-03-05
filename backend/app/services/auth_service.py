from typing import Optional
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
        try:
            user = UserRepository.find_user_by_email(email)
        except Exception:
            user = None
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
        
        # Check if user already exists (catch 0-rows so customer register works)
        try:
            existing_user = UserRepository.find_user_by_email(signup_data["email"])
        except Exception:
            existing_user = None
        if existing_user:
            return None
        
        # Hash password
        hashed_pwd = hash_password(signup_data["password"])
        
        # Create user (omit created_at/updated_at; DB defaults handle them)
        user_data = {
            "email": signup_data["email"],
            "password_hash": hashed_pwd,
            "first_name": signup_data["first_name"],
            "last_name": signup_data["last_name"],
            "phone": signup_data["phone"],
            "user_type": signup_data["user_type"],
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
        user_safe = {k: v for k, v in user.items() if k != "password_hash"}
        return {
            "message": f"{signup_data['user_type'].capitalize()} signup successful!",
            "user": user_safe,
            "access_token": token
        }

    @staticmethod
    def authenticate_user_exclude_rider(email: str, password: str) -> Optional[dict]:
        """Authenticate a user but reject riders (for customer/restaurant login only)."""
        result = AuthService.authenticate_user(email, password, expected_user_type=None)
        if result and result.get("user_type") == "rider":
            return None
        return result

    @staticmethod
    def create_user_account_user_only(signup_data: dict) -> Optional[dict]:
        """Create user account for customers/restaurant only. Rejects rider signup."""
        if signup_data.get("user_type") == "rider":
            return None
        if signup_data.get("user_type") not in ("customer", "restaurant"):
            signup_data = {**signup_data, "user_type": "customer"}
        return AuthService.create_user_account(signup_data)