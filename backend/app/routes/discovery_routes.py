"""
Public routes for customer app: browse restaurants and menus (no auth).
Used by the consumer frontend for home, restaurant list, and restaurant detail.
"""
from fastapi import APIRouter, HTTPException
import logging

from ..services.customer_service import CustomerService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/restaurants", tags=["Discovery"])


@router.get("")
def list_restaurants():
    """List approved restaurants from Supabase. No auth required."""
    try:
        restaurants = CustomerService.get_restaurants_list()
        logger.info(f"Returning {len(restaurants)} restaurants")
        
        # Log first restaurant's image_url for debugging
        if restaurants:
            logger.info(f"First restaurant: {restaurants[0].get('name')} - image_url: {restaurants[0].get('image_url')}")
            
        return {"restaurants": restaurants}
    except Exception as e:
        logger.error(f"Error fetching restaurants: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurants")


@router.get("/{restaurant_id}")
def get_restaurant_with_menu(restaurant_id: int):
    """Get one restaurant with its menus and menu items. No auth required."""
    try:
        result = CustomerService.get_restaurant_with_menu(restaurant_id)
        if not result:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        logger.info(f"Returning restaurant {restaurant_id} with image_url: {result.get('image_url')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching restaurant {restaurant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch restaurant")