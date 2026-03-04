from typing import List, Optional, Dict
from ..repositories.admin_user_repo import AdminUserRepository


class AdminUserService:

    @staticmethod
    def get_all_users(user_type: Optional[str] = None) -> List[Dict]:
        try:
            return AdminUserRepository.get_all_users(user_type)
        except Exception as e:
            print(f"Error in get_all_users: {e}")
            return []

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict]:
        try:
            return AdminUserRepository.get_user_by_id(user_id)
        except Exception as e:
            print(f"Error in get_user_by_id for user {user_id}: {e}")
            return None

    @staticmethod
    def update_user_role(user_id: int, new_role: str) -> Optional[Dict]:
        # Allow both rider and rider_pending as valid roles
        allowed_roles = ["customer", "rider", "owner", "admin", "rider_pending"]

        if new_role not in allowed_roles:
            print(f"Invalid role: {new_role}")
            return None

        try:
            # When changing from rider_pending to rider, also update rider status
            if new_role == "rider":
                # Get the user first to check if they were pending
                user = AdminUserRepository.get_user_by_id(user_id)
                if user and user.get("user_type") == "rider_pending":
                    # Update rider status to available when approved
                    from ..repositories.delivery_repo import DeliveryRepository
                    rider = DeliveryRepository.get_rider_by_user_id(user_id)
                    if rider:
                        DeliveryRepository.update_rider_status(rider["id"], "available")
            
            return AdminUserRepository.update_user_role(user_id, new_role)
        except Exception as e:
            print(f"Error in update_user_role for user {user_id}: {e}")
            return None

    @staticmethod
    def delete_user(user_id: int) -> bool:
        try:
            return AdminUserRepository.delete_user(user_id)
        except Exception as e:
            print(f"Error in delete_user for user {user_id}: {e}")
            return False