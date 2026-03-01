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
        allowed_roles = ["customer", "rider", "owner", "admin"]

        if new_role not in allowed_roles:
            print(f"Invalid role: {new_role}")
            return None

        try:
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