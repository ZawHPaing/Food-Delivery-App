from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..models.admin_user_models import UserResponse, UpdateUserRoleRequest
from ..services.admin_user_service import AdminUserService

router = APIRouter(prefix="/admin/users", tags=["Admin"])


@router.get("/")
def list_users(user_type: Optional[str] = Query(None)):
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


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
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


@router.put("/role", response_model=UserResponse)
def update_role(request: UpdateUserRoleRequest):
    """
    Update user role
    """
    user = AdminUserService.update_user_role(
        request.user_id,
        request.user_type
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid role or user not found"
        )

    return user


@router.delete("/{user_id}")
def delete_user(user_id: int):
    """
    Delete user
    """
    success = AdminUserService.delete_user(user_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "success": True,
        "message": "User deleted successfully"
    }