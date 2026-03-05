from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: Optional[int]
    quantity: int
    price_cents: int
    special_instructions: Optional[str]
    item_name: Optional[str] = None  # From joined query

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    restaurant_id: Optional[int]
    status: str
    subtotal_cents: int
    tax_cents: int
    delivery_fee_cents: int
    total_cents: int
    delivery_address: Optional[str]
    delivery_latitude: Optional[float]
    delivery_longitude: Optional[float]
    created_at: datetime
    updated_at: datetime
    
    # Joined fields
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    restaurant_name: Optional[str] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str


class OrdersListResponse(BaseModel):
    success: bool
    orders: List[OrderResponse]
    total_count: int
    page: int
    per_page: int


class OrderStatsResponse(BaseModel):
    total_orders: int
    pending_orders: int
    confirmed_orders: int
    preparing_orders: int
    ready_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue_cents: int
    today_orders: int
    today_revenue_cents: int


class OrderDetailResponse(BaseModel):
    success: bool
    order: OrderResponse