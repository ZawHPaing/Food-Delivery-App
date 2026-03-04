from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Restaurant Models
class RestaurantBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    cuisine_type: Optional[str] = None
    is_approved: bool = False

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    cuisine_type: Optional[str] = None
    is_approved: Optional[bool] = None

class RestaurantResponse(RestaurantBase):
    id: int
    created_at: datetime
    average_rating: float = 0
    total_reviews: int = 0
    menu_count: int = 0
    order_count: int = 0

    class Config:
        from_attributes = True

class RestaurantListResponse(BaseModel):
    success: bool
    restaurants: List[RestaurantResponse]

class RestaurantDetailResponse(BaseModel):
    success: bool
    restaurant: RestaurantResponse

# Statistics
class RestaurantStats(BaseModel):
    total_restaurants: int
    approved_restaurants: int
    pending_approval: int
    restaurants_by_city: dict
    restaurants_by_cuisine: dict