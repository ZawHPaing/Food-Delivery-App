from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Category Models
class CategoryCreate(BaseModel):
    name: str

class CategoryResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# Menu Item Models
class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_cents: int = Field(..., gt=0, description="Price in cents")
    is_available: bool = True
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    category_ids: List[int] = []

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_cents: Optional[int] = Field(None, gt=0)
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    category_ids: Optional[List[int]] = None

class MenuItemResponse(MenuItemBase):
    id: int
    menu_id: int
    categories: List[CategoryResponse] = []

    class Config:
        from_attributes = True

# Menu Models
class MenuBase(BaseModel):
    name: Optional[str] = None
    is_active: bool = True

class MenuCreate(MenuBase):
    restaurant_id: int

class MenuUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class MenuResponse(MenuBase):
    id: int
    restaurant_id: int
    items: List[MenuItemResponse] = []

    class Config:
        from_attributes = True

# Restaurant Menu Response
class RestaurantMenuResponse(BaseModel):
    restaurant_id: int
    restaurant_name: str
    menus: List[MenuResponse]

    class Config:
        from_attributes = True

# Bulk Operations
class BulkMenuItemCreate(BaseModel):
    items: List[MenuItemCreate]