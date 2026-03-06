from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..models.admin_user_models import UserResponse, UpdateUserRoleRequest
from ..services.admin_user_service import AdminUserService
from ..repositories.admin_user_repo import AdminUserRepository  # Add this import
from pydantic import BaseModel  # Add this for the update request model

router = APIRouter(prefix="/admin", tags=["Admin"])

# Add a request model for user updates
class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

# User Management Routes
@router.get("/users/")
async def list_users(user_type: Optional[str] = Query(None)):
    """
    Get all users (optionally filter by role)
    Always returns: { "users": [...] }
    """
    try:
        users = AdminUserService.get_all_users(user_type)

        return {
            "success": True,
            "users": users or []
        }

    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch users"
        )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """
    Get single user
    """
    user = AdminUserService.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(user_id: int, request: UpdateUserRoleRequest):
    """
    Update user role
    """
    user = AdminUserService.update_user_role(
        user_id,
        request.user_type
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid role or user not found"
        )

    return user


@router.put("/users/{user_id}")
async def update_user(user_id: int, request: UpdateUserRequest):
    """
    Update user details (email, first_name, last_name, phone)
    """
    try:
        print(f"=== UPDATE USER CALLED for user {user_id} ===")
        print(f"Request data: {request.dict()}")
        
        # Extract allowed fields
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        
        print(f"Update data after filtering: {update_data}")
        
        if not update_data:
            print("No valid fields to update")
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Call service to update user
        updated_user = AdminUserService.update_user(user_id, update_data)
        
        if not updated_user:
            print(f"Failed to update user {user_id}")
            # Check if user exists
            user = AdminUserService.get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            else:
                raise HTTPException(status_code=400, detail="Failed to update user - possibly email already in use")
        
        print(f"User updated successfully: {updated_user}")
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")


@router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    """
    Delete user
    """
    try:
        success = AdminUserService.delete_user(user_id)

        if not success:
            # Check if user exists to give more specific error
            user = AdminUserService.get_user_by_id(user_id)
            if user:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to delete user due to server error"
                )
            else:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )

        return {
            "success": True,
            "message": "User deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error deleting user {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while deleting user"
        )


# Dashboard Statistics
@router.get("/dashboard/stats")
async def get_dashboard_stats():
    """
    Get admin dashboard statistics (users, orders, etc.)
    Note: Restaurant stats are now handled in restaurant_routes.py
    """
    try:
        # These should ideally be moved to a service/repository
        # But keeping for now since they're user/order stats
        from ..supabase_client import supabase
        
        # User counts by role
        users_response = supabase.table("users") \
            .select("user_type", count="exact") \
            .execute()
        
        # Order counts by status
        orders_response = supabase.table("orders") \
            .select("status", count="exact") \
            .execute()
        
        # Today's orders
        from datetime import datetime, timedelta
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        today_orders_response = supabase.table("orders") \
            .select("id", count="exact") \
            .gte("created_at", today_start) \
            .execute()
        
        # Calculate user counts by role
        user_counts = {
            "customer": 0,
            "rider": 0,
            "owner": 0,
            "admin": 0
        }
        
        for user in users_response.data or []:
            role = user.get("user_type", "customer")
            if role in user_counts:
                user_counts[role] += 1
            else:
                user_counts[role] = 1
        
        return {
            "success": True,
            "stats": {
                "total_users": users_response.count,
                "users_by_role": user_counts,
                "total_orders": orders_response.count,
                "orders_today": today_orders_response.count
            }
        }
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch dashboard statistics"
        )