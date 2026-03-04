from fastapi import APIRouter, HTTPException, Query, Header, Depends
from typing import List, Optional
from ..models.menu_models import (
    MenuCategoryCreate,
    MenuCategoryResponse,
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    MenuWithItemsResponse,
)
from ..services.menu_service import MenuService
from ..services.restaurant_service import RestaurantService
from ..core.security import decode_access_token

router = APIRouter(prefix="/restaurant/menus", tags=["Restaurant Menus"])


def get_restaurant_id_from_auth(authorization: Optional[str] = Header(None, alias="Authorization")) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("user_type") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant account")
    rest = RestaurantService.get_restaurant_by_user_id(payload["user_id"])
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found for this user")
    return rest["id"]


@router.post("", response_model=MenuCategoryResponse)
def create_menu_category(
    data: MenuCategoryCreate,
    restaurant_id: int = Depends(get_restaurant_id_from_auth),
):
    category = MenuService.create_menu_category(restaurant_id, data.name)
    if not category:
        raise HTTPException(status_code=400, detail="Failed to create category")
    return category


@router.get("", response_model=List[MenuWithItemsResponse])
def get_menus_with_items(restaurant_id: int = Query(...)):
    return MenuService.get_menus_with_items(restaurant_id)


@router.post("/{menu_id}/items", response_model=MenuItemResponse)
def add_menu_item(
    menu_id: int,
    data: MenuItemCreate,
    restaurant_id: int = Depends(get_restaurant_id_from_auth),
):
    if MenuService.get_restaurant_id_for_menu(menu_id) != restaurant_id:
        raise HTTPException(status_code=403, detail="Menu does not belong to your restaurant")
    item = MenuService.add_menu_item(menu_id, data.dict())
    if not item:
        raise HTTPException(status_code=400, detail="Failed to add item")
    return item


@router.patch("/items/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: int,
    data: MenuItemUpdate,
    restaurant_id: int = Depends(get_restaurant_id_from_auth),
):
    if MenuService.get_restaurant_id_for_item(item_id) != restaurant_id:
        raise HTTPException(status_code=403, detail="Item does not belong to your restaurant")
    updated = MenuService.update_menu_item(item_id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated


@router.delete("/items/{item_id}")
def delete_menu_item(
    item_id: int,
    restaurant_id: int = Depends(get_restaurant_id_from_auth),
):
    if MenuService.get_restaurant_id_for_item(item_id) != restaurant_id:
        raise HTTPException(status_code=403, detail="Item does not belong to your restaurant")
    if not MenuService.delete_menu_item(item_id):
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}
