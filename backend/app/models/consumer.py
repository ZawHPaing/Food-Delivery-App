from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# ==========================================
# Restaurant & Menu Models
# ==========================================

class RestaurantResponse(BaseModel):
    model_config = {"extra": "allow"}
    id: int
    name: str
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    average_rating: Optional[float] = None
    total_reviews: Optional[int] = None
    is_active: Optional[bool] = True
    image: Optional[str] = None
    deliveryTime: Optional[str] = None
    deliveryFee: Optional[str] = None
    distance: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    created_at: Optional[Any] = None
    isOpen: Optional[bool] = None
    
class MenuItemResponse(BaseModel):
    model_config = {"extra": "allow"}
    id: int
    restaurant_id: Optional[int] = None
    menu_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    price_cents: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    image: Optional[str] = None
    is_available: Optional[bool] = True
    calories: Optional[int] = None

# ==========================================
# Order Models
# ==========================================

class CartItemCreate(BaseModel):
    menu_item_id: int
    quantity: int
    special_instructions: Optional[str] = None

class OrderCreate(BaseModel):
    # Customer Info
    first_name: str
    last_name: str
    email: str
    phone: str
    
    # Delivery Address
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    postal_code: str
    delivery_instructions: Optional[str] = None
    
    # Payment Info
    payment_method: str
    
    # Order Details
    restaurant_id: int
    items: List[CartItemCreate]
    subtotal: float
    delivery_fee: float
    tax: float
    total_amount: float
    
class OrderResponse(BaseModel):
    model_config = {"extra": "allow"}
    id: int
    user_id: Optional[int] = None
    restaurant_id: int
    total_cents: int
    status: str
    created_at: Any
    updated_at: Optional[Any] = None
