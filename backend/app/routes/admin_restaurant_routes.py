from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from ..models.admin_restaurant_models import (
    RestaurantCreate, RestaurantUpdate, RestaurantResponse,
    RestaurantStats, RestaurantListResponse, RestaurantDetailResponse
)
from ..services.admin_restaurant_service import RestaurantService

router = APIRouter(prefix="/admin/restaurants", tags=["Admin - Restaurants"])

# ==================== DEBUG ROUTES ====================
@router.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to see all routes"""
    routes = []
    for route in router.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": list(route.methods) if route.methods else []
        })
    return {"routes": routes}


@router.get("/debug/count")
async def debug_restaurant_count():
    """Debug endpoint to check restaurant count"""
    try:
        restaurants = await RestaurantService.get_all_restaurants(False)
        return {
            "count": len(restaurants),
            "restaurants": restaurants
        }
    except Exception as e:
        return {"error": str(e)}


# ==================== STATISTICS ROUTE (MUST BE FIRST) ====================
@router.get("/stats/dashboard")  # Changed from /statistics to /stats/dashboard
async def get_dashboard_statistics():
    """
    Get restaurant statistics including:
    - Total restaurants
    - Approved count
    - Pending approval count
    - Breakdown by city and cuisine
    """
    try:
        print("=" * 50)
        print("DASHBOARD STATISTICS ENDPOINT CALLED")
        print("=" * 50)
        
        stats = await RestaurantService.get_restaurant_stats()
        
        return {
            "success": True,
            "total_restaurants": stats.get("total_restaurants", 0),
            "approved_restaurants": stats.get("approved_restaurants", 0),
            "pending_approval": stats.get("pending_approval", 0),
            "restaurants_by_city": stats.get("restaurants_by_city", {}),
            "restaurants_by_cuisine": stats.get("restaurants_by_cuisine", {})
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")


@router.get("/test/routes")
async def test_routes():
    """Test endpoint to verify route ordering"""
    return {
        "message": "Route ordering is correct",
        "static_routes": ["/stats/dashboard", "/", "/debug/count", "/test/routes"],
        "dynamic_routes": ["/{restaurant_id}", "/{restaurant_id}/approve"]
    }


# ==================== MAIN LIST ENDPOINT ====================
@router.get("/")
async def get_all_restaurants(
    approved_only: bool = Query(False, description="Show only approved restaurants")
):
    """Get all restaurants"""
    try:
        print("=" * 50)
        print("GET ALL RESTAURANTS ENDPOINT CALLED")
        print("=" * 50)
        
        restaurants = await RestaurantService.get_all_restaurants(approved_only)
        print(f"Found {len(restaurants)} restaurants")
        
        return {
            "success": True,
            "restaurants": restaurants
        }
    except Exception as e:
        print(f"Error fetching restaurants: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch restaurants")


# ==================== DYNAMIC ROUTES (WITH PARAMETERS) ====================
@router.get("/{restaurant_id}")
async def get_restaurant(
    restaurant_id: int
):
    """
    Get detailed information about a specific restaurant by ID
    Includes metrics like menu count, order count, and average rating
    """
    try:
        print(f"Fetching restaurant {restaurant_id}...")
        
        # Validate that restaurant_id is actually a number
        if restaurant_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid restaurant ID")
        
        restaurant = await RestaurantService.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        return {
            "success": True,
            "restaurant": restaurant
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching restaurant {restaurant_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch restaurant")


@router.post("/")
async def create_restaurant(
    restaurant: RestaurantCreate
):
    """
    Create a new restaurant
    Required fields: name
    Optional fields: description, city, cuisine_type, is_approved, etc.
    """
    try:
        print(f"Creating restaurant: {restaurant.name}")
        result = await RestaurantService.create_restaurant(restaurant)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create restaurant")
        
        return {
            "success": True,
            "restaurant": result
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating restaurant: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create restaurant")


@router.put("/{restaurant_id}")
async def update_restaurant(
    restaurant_id: int,
    restaurant: RestaurantUpdate
):
    """
    Update an existing restaurant
    Only include fields that need to be updated
    """
    try:
        print(f"Updating restaurant {restaurant_id}")
        
        if restaurant_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid restaurant ID")
        
        success = await RestaurantService.update_restaurant(restaurant_id, restaurant)
        if not success:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        return {
            "success": True,
            "message": "Restaurant updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating restaurant {restaurant_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update restaurant")


@router.delete("/{restaurant_id}")
async def delete_restaurant(
    restaurant_id: int
):
    """
    Delete a restaurant and all associated data
    This will cascade delete menus, menu items, etc.
    """
    try:
        print(f"Deleting restaurant {restaurant_id}")
        
        if restaurant_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid restaurant ID")
        
        success = await RestaurantService.delete_restaurant(restaurant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        return {
            "success": True,
            "message": "Restaurant deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting restaurant {restaurant_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to delete restaurant")


@router.patch("/{restaurant_id}/approve")
async def approve_restaurant(
    restaurant_id: int,
    approve: bool = Query(True, description="Set to true to approve, false to reject")
):
    """
    Approve or reject a restaurant
    - approve=true: Approve the restaurant (makes it visible to customers)
    - approve=false: Reject/unapprove the restaurant (hides it from customers)
    """
    try:
        print(f"{'Approving' if approve else 'Rejecting'} restaurant {restaurant_id}")
        
        if restaurant_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid restaurant ID")
        
        restaurant = await RestaurantService.approve_restaurant(restaurant_id, approve)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        return {
            "success": True,
            "message": f"Restaurant {'approved' if approve else 'rejected'} successfully",
            "restaurant": restaurant
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving restaurant {restaurant_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update restaurant approval status")

import traceback

print("=" * 80)
print("RESTAURANT ROUTES MODULE LOADING")
print("=" * 80)
traceback.print_stack()
print("=" * 80)