from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
from pydantic import BaseModel
from ..core.security import decode_access_token
from ..supabase_client import supabase

router = APIRouter(prefix="/admin/restaurants", tags=["Admin Restaurants"])


def get_admin_user(authorization: Optional[str] = Header(None, alias="Authorization")) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


@router.get("/pending")
async def get_pending_restaurants(
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    try:
        resp = supabase.table("restaurants").select("*").eq("is_approved", False).execute()
        return resp.data or []
    except Exception:
        return []


class StatusUpdate(BaseModel):
    is_approved: bool


# Restaurants are read-only in this database; not managed here.
@router.patch("/{restaurant_id}/status")
async def update_restaurant_status(
    restaurant_id: int,
    body: StatusUpdate,
    _: dict = Depends(get_admin_user),
):
    raise HTTPException(
        status_code=501,
        detail="Restaurant management is not used in this database; restaurants are read-only.",
    )


@router.delete("/{restaurant_id}")
async def delete_restaurant(
    restaurant_id: int,
    _: dict = Depends(get_admin_user),
):
    raise HTTPException(
        status_code=501,
        detail="Restaurant management is not used in this database; restaurants are read-only.",
    )
