from typing import List, Optional, Dict
from ..repositories.admin_user_repo import AdminUserRepository


class AdminUserService:

    @staticmethod
    def get_all_users(user_type: Optional[str] = None) -> List[Dict]:
        return AdminUserRepository.get_all_users(user_type)

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict]:
        return AdminUserRepository.get_user_by_id(user_id)

    @staticmethod
    def update_user_role(user_id: int, new_role: str) -> Optional[Dict]:
        allowed_roles = ["customer", "rider", "owner", "admin"]

        if new_role not in allowed_roles:
            return None

        return AdminUserRepository.update_user_role(user_id, new_role)

    @staticmethod
    def delete_user(user_id: int) -> bool:
        return AdminUserRepository.delete_user(user_id)