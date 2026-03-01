from pydantic import BaseModel
from typing import Optional, List


class MenuCategoryCreate(BaseModel):
    name: str
    is_active: bool = True


class MenuCategoryResponse(BaseModel):
    id: int
    restaurant_id: int
    name: str
    is_active: Optional[bool] = True


class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price_cents: int
    is_available: bool = True
    image_url: Optional[str] = None


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_cents: Optional[int] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None


class MenuItemResponse(BaseModel):
    id: int
    menu_id: int
    name: str
    description: Optional[str] = None
    price_cents: int
    is_available: Optional[bool] = True
    image_url: Optional[str] = None


class MenuWithItemsResponse(MenuCategoryResponse):
    items: List[MenuItemResponse] = []
