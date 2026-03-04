"""
Public routes for customer app: browse restaurants and menus (no auth).
Used by the consumer frontend for home, restaurant list, and restaurant detail.
"""
from fastapi import APIRouter, HTTPException

from ..services.customer_service import CustomerService

router = APIRouter(prefix="/restaurants", tags=["Discovery"])


@router.get("")
def list_restaurants():
    """List approved restaurants from Supabase. No auth required."""
    try:
        restaurants = CustomerService.get_restaurants_list()
        return {"restaurants": restaurants}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch restaurants")


@router.get("/{restaurant_id}")
def get_restaurant_with_menu(restaurant_id: int):
    """Get one restaurant with its menus and menu items. No auth required."""
    result = CustomerService.get_restaurant_with_menu(restaurant_id)
    if not result:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return result
