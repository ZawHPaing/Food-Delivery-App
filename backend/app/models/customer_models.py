from pydantic import BaseModel
from typing import List, Optional

# ----- Address (schema: street, city, state, postal_code, country, label, latitude, longitude, is_default) -----
class AddressCreate(BaseModel):
    street: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: Optional[bool] = False

class AddressUpdate(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: Optional[bool] = None

class AddressResponse(BaseModel):
    id: int
    user_id: int
    street: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool

    class Config:
        from_attributes = True

# ----- Payment (schema: per order - order_id, user_id, status, amount_cents, payment_method, transaction_id, paid_at) -----
class PaymentResponse(BaseModel):
    id: int
    order_id: int
    user_id: Optional[int] = None
    status: Optional[str] = None
    amount_cents: int
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    paid_at: Optional[str] = None

    class Config:
        from_attributes = True

# ----- Order (schema: status, subtotal_cents, tax_cents, delivery_fee_cents, total_cents, delivery_address text) -----
class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int
    special_instructions: Optional[str] = None

class OrderCreate(BaseModel):
    restaurant_id: int
    delivery_address: str = ""  # full address text (or use address_id to resolve)
    address_id: Optional[int] = None  # if set, resolve to delivery_address from saved address
    payment_method: str = "cash"  # "cash" = cash on delivery (pay when delivered); "card" = later
    tax_cents: int = 0
    delivery_fee_cents: int = 0
    voucher_code: Optional[str] = None  # optional discount code (validated at place_order)
    items: List[OrderItemCreate]


class VoucherValidateResponse(BaseModel):
    valid: bool
    discount_cents: int = 0
    message: str = ""

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: Optional[int] = None
    quantity: int
    price_cents: int
    special_instructions: Optional[str] = None
    name: Optional[str] = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    restaurant_id: Optional[int] = None
    status: str
    subtotal_cents: int
    tax_cents: int
    delivery_fee_cents: int
    total_cents: int
    delivery_address: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    items: List[OrderItemResponse] = []
    restaurant_name: Optional[str] = None

    class Config:
        from_attributes = True

class OrderPlaceResponse(BaseModel):
    message: str
    order: OrderResponse

# ----- Review (schema: order_id, reviewer_id, restaurant_id, rating, comment) -----
class ReviewCreate(BaseModel):
    restaurant_id: int
    order_id: Optional[int] = None
    rating: int
    comment: str

class ReviewResponse(BaseModel):
    id: int
    order_id: Optional[int] = None
    reviewer_id: Optional[int] = None
    restaurant_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None

    class Config:
        from_attributes = True

# ----- Notification (schema: type, title, message, channel, body, sent_at) -----
class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    channel: Optional[str] = None
    body: Optional[str] = None
    sent_at: Optional[str] = None

    class Config:
        from_attributes = True

# ----- Customer Profile (from users only; no customers table) -----
class CustomerProfileResponse(BaseModel):
    user_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class CustomerProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
