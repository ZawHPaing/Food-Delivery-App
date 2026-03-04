from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models.admin_menu_models import (
    CategoryCreate, CategoryResponse,
    MenuCreate, MenuUpdate, MenuResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
    RestaurantMenuResponse, BulkMenuItemCreate
)
from ..services.admin_menu_service import MenuService

router = APIRouter(prefix="/menu", tags=["Menu Management"])

# Category endpoints
@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """Get all categories"""
    try:
        categories = await MenuService.get_all_categories()
        return categories
    except Exception as e:
        print(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")


@router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate):
    """Create a new category"""
    try:
        result = await MenuService.create_category(category)
        if not result:
            raise HTTPException(status_code=400, detail="Category already exists")
        return result
    except Exception as e:
        print(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")


@router.delete("/categories/{category_id}")
async def delete_category(category_id: int):
    """Delete a category"""
    try:
        success = await MenuService.delete_category(category_id)
        if not success:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"message": "Category deleted successfully"}
    except Exception as e:
        print(f"Error deleting category: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete category")


# Restaurant menu endpoints
@router.get("/restaurant/{restaurant_id}", response_model=RestaurantMenuResponse)
async def get_restaurant_menu(restaurant_id: int):
    """Get complete menu for a restaurant"""
    try:
        result = await MenuService.get_restaurant_menus(restaurant_id)
        if not result:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        return result
    except Exception as e:
        print(f"Error fetching restaurant menu: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch menu")


# Menu endpoints
@router.post("/menus", response_model=MenuResponse)
async def create_menu(menu: MenuCreate):
    """Create a new menu"""
    try:
        result = await MenuService.create_menu(menu)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create menu")
        return result
    except Exception as e:
        print(f"Error creating menu: {e}")
        raise HTTPException(status_code=500, detail="Failed to create menu")


@router.put("/menus/{menu_id}")
async def update_menu(menu_id: int, menu: MenuUpdate):
    """Update a menu"""
    try:
        success = await MenuService.update_menu(menu_id, menu)
        if not success:
            raise HTTPException(status_code=404, detail="Menu not found")
        return {"message": "Menu updated successfully"}
    except Exception as e:
        print(f"Error updating menu: {e}")
        raise HTTPException(status_code=500, detail="Failed to update menu")


@router.delete("/menus/{menu_id}")
async def delete_menu(menu_id: int):
    """Delete a menu"""
    try:
        success = await MenuService.delete_menu(menu_id)
        if not success:
            raise HTTPException(status_code=404, detail="Menu not found")
        return {"message": "Menu deleted successfully"}
    except Exception as e:
        print(f"Error deleting menu: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete menu")


# Menu Item endpoints
@router.post("/menus/{menu_id}/items", response_model=MenuItemResponse)
async def create_menu_item(menu_id: int, item: MenuItemCreate):
    """Create a new menu item"""
    try:
        result = await MenuService.create_menu_item(menu_id, item)
        if not result:
            raise HTTPException(status_code=404, detail="Menu not found")
        return result
    except Exception as e:
        print(f"Error creating menu item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create menu item")


@router.post("/menus/{menu_id}/items/bulk", response_model=List[MenuItemResponse])
async def bulk_create_menu_items(menu_id: int, items: BulkMenuItemCreate):
    """Create multiple menu items at once"""
    try:
        result = await MenuService.bulk_create_menu_items(menu_id, items.items)
        if not result:
            raise HTTPException(status_code=404, detail="Menu not found")
        return result
    except Exception as e:
        print(f"Error bulk creating menu items: {e}")
        raise HTTPException(status_code=500, detail="Failed to create menu items")


@router.put("/items/{item_id}")
async def update_menu_item(item_id: int, item: MenuItemUpdate):
    """Update a menu item"""
    try:
        success = await MenuService.update_menu_item(item_id, item)
        if not success:
            raise HTTPException(status_code=404, detail="Menu item not found")
        return {"message": "Menu item updated successfully"}
    except Exception as e:
        print(f"Error updating menu item: {e}")
        raise HTTPException(status_code=500, detail="Failed to update menu item")


@router.delete("/items/{item_id}")
async def delete_menu_item(item_id: int):
    """Delete a menu item"""
    try:
        success = await MenuService.delete_menu_item(item_id)
        if not success:
            raise HTTPException(status_code=404, detail="Menu item not found")
        return {"message": "Menu item deleted successfully"}
    except Exception as e:
        print(f"Error deleting menu item: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete menu item")


@router.patch("/items/{item_id}/availability")
async def toggle_item_availability(item_id: int, is_available: bool = Query(...)):
    """Toggle menu item availability"""
    try:
        success = await MenuService.toggle_item_availability(item_id, is_available)
        if not success:
            raise HTTPException(status_code=404, detail="Menu item not found")
        return {"message": f"Item availability set to {is_available}"}
    except Exception as e:
        print(f"Error toggling availability: {e}")
        raise HTTPException(status_code=500, detail="Failed to toggle availability")