from typing import Optional, Dict, List
from ..supabase_client import supabase

class UserRepository:
    
    @staticmethod
    def find_user_by_email(email: str) -> Optional[Dict]:
        """Find user by email"""
        response = supabase.table("users") \
            .select("*") \
            .eq("email", email) \
            .single() \
            .execute()
        return response.data if response.data else None
    
    @staticmethod
    def find_user_by_id(user_id: int) -> Optional[Dict]:
        """Find user by ID"""
        response = supabase.table("users") \
            .select("*") \
            .eq("id", user_id) \
            .single() \
            .execute()
        return response.data if response.data else None
    
    @staticmethod
    def create_user(user_data: dict) -> Optional[Dict]:
        """Create a new user. Handles Supabase returning row as list or single object."""
        response = supabase.table("users").insert(user_data).execute()
        if not response.data:
            return None
        data = response.data
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        if isinstance(data, dict):
            return data
        return None
    
    @staticmethod
    def update_user(user_id: int, user_data: dict) -> Optional[Dict]:
        """Update user information"""
        response = supabase.table("users") \
            .update(user_data) \
            .eq("id", user_id) \
            .execute()
        data = response.data
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        if isinstance(data, dict):
            return data
        return None

    @staticmethod
    def find_users_by_email_pattern(email_pattern: str) -> List[Dict]:
        """Find users by email pattern (for username search)"""
        response = supabase.table("users") \
            .select("id, email, first_name, last_name, phone") \
            .ilike("email", f"%{email_pattern}%") \
            .execute()
        return response.data or []