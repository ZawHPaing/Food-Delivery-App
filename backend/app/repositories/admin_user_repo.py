from typing import List, Optional, Dict
from ..supabase_client import supabase


class AdminUserRepository:

    @staticmethod
    def get_all_users(user_type: Optional[str] = None) -> List[Dict]:
        query = supabase.table("users").select("""
            id,
            email,
            first_name,
            last_name,
            phone,
            user_type,
            created_at
        """)

        if user_type:
            query = query.eq("user_type", user_type)

        response = query.order("created_at", desc=True).execute()
        return response.data or []

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict]:
        response = supabase.table("users") \
            .select("*") \
            .eq("id", user_id) \
            .single() \
            .execute()

        return response.data if response.data else None

    @staticmethod
    def update_user_role(user_id: int, new_role: str) -> Optional[Dict]:
        response = supabase.table("users") \
            .update({"user_type": new_role}) \
            .eq("id", user_id) \
            .execute()

        if response.data:
            return response.data[0]
        return None

    @staticmethod
    def delete_user(user_id: int) -> bool:
        """Delete a user and return True if successful"""
        try:
            response = supabase.table("users") \
                .delete() \
                .eq("id", user_id) \
                .execute()
            
            # Check if any data was returned (successful deletion)
            # Some Supabase versions return data, others return an empty array
            return response.data is not None and len(response.data) > 0
            
        except Exception as e:
            print(f"Error deleting user {user_id}: {e}")
            return False