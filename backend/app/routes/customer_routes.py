from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from ..models.customer_models import (
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    PaymentResponse,
    OrderCreate,
    OrderResponse,
    OrderPlaceResponse,
    ReviewCreate,
    ReviewResponse,
    NotificationResponse,
    CustomerProfileResponse,
    CustomerProfileUpdate,
)
from ..services.customer_service import CustomerService
from ..core.security import decode_access_token

router = APIRouter(prefix="/customer", tags=["Customer"])


def get_current_customer_id(authorization: Optional[str] = Header(None, alias="Authorization")) -> int:
    """Dependency: extract customer user_id from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("user_type") != "customer":
        raise HTTPException(status_code=403, detail="Not a customer account")
    return user_id


# ----- Profile -----
@router.get("/profile", response_model=CustomerProfileResponse)
def get_profile(user_id: int = Depends(get_current_customer_id)):
    """Get current customer profile (from users table)."""
    profile = CustomerService.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return profile


@router.patch("/profile", response_model=CustomerProfileResponse)
def update_profile(data: CustomerProfileUpdate, user_id: int = Depends(get_current_customer_id)):
    """Update current customer profile (first_name, last_name, phone)."""
    profile = CustomerService.update_profile(user_id, data.dict(exclude_unset=True))
    if not profile:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return profile


# ----- Addresses -----
@router.get("/addresses", response_model=list[AddressResponse])
def list_addresses(user_id: int = Depends(get_current_customer_id)):
    return CustomerService.list_addresses(user_id)


@router.get("/addresses/{address_id}", response_model=AddressResponse)
def get_address(address_id: int, user_id: int = Depends(get_current_customer_id)):
    addr = CustomerService.get_address(user_id, address_id)
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    return addr


@router.post("/addresses", response_model=AddressResponse)
def create_address(data: AddressCreate, user_id: int = Depends(get_current_customer_id)):
    addr = CustomerService.create_address(user_id, data.dict())
    if not addr:
        raise HTTPException(status_code=400, detail="Failed to create address")
    return addr


@router.patch("/addresses/{address_id}", response_model=AddressResponse)
def update_address(address_id: int, data: AddressUpdate, user_id: int = Depends(get_current_customer_id)):
    addr = CustomerService.update_address(user_id, address_id, data.dict(exclude_unset=True))
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    return addr


@router.delete("/addresses/{address_id}")
def delete_address(address_id: int, user_id: int = Depends(get_current_customer_id)):
    ok = CustomerService.delete_address(user_id, address_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted"}


# ----- Payments (read-only; payments are created when placing an order) -----
@router.get("/payments", response_model=list[PaymentResponse])
def list_payments(user_id: int = Depends(get_current_customer_id)):
    return CustomerService.list_payments(user_id)


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, user_id: int = Depends(get_current_customer_id)):
    pay = CustomerService.get_payment(user_id, payment_id)
    if not pay:
        raise HTTPException(status_code=404, detail="Payment not found")
    return pay


# ----- Orders -----
@router.post("/orders", response_model=OrderPlaceResponse)
def place_order(data: OrderCreate, user_id: int = Depends(get_current_customer_id)):
    """Place order. Use delivery_address text or address_id to resolve from saved address; prices from menu_items."""
    delivery_address = data.delivery_address or ""
    if data.address_id is not None:
        addr = CustomerService.get_address(user_id, data.address_id)
        if addr:
            delivery_address = CustomerService.format_address_as_text(
                {"street": addr.street, "city": addr.city, "state": addr.state, "postal_code": addr.postal_code, "country": addr.country}
            )
    if not delivery_address.strip():
        raise HTTPException(status_code=400, detail="delivery_address or address_id required")
    items = [
        {
            "menu_item_id": i.menu_item_id,
            "quantity": i.quantity,
            "special_instructions": i.special_instructions,
        }
        for i in data.items
    ]
    order = CustomerService.place_order(
        user_id,
        data.restaurant_id,
        delivery_address,
        data.payment_method,
        data.tax_cents,
        data.delivery_fee_cents,
        items,
    )
    if not order:
        raise HTTPException(
            status_code=400,
            detail="Failed to place order (check restaurant and menu items)",
        )
    return {"message": "Order placed", "order": order}


@router.get("/orders", response_model=list[OrderResponse])
def list_orders(user_id: int = Depends(get_current_customer_id)):
    return CustomerService.list_orders(user_id)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, user_id: int = Depends(get_current_customer_id)):
    order = CustomerService.get_order(user_id, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ----- Reviews -----
@router.post("/reviews", response_model=ReviewResponse)
def create_review(data: ReviewCreate, user_id: int = Depends(get_current_customer_id)):
    review = CustomerService.create_review(
        user_id,
        data.restaurant_id,
        data.rating,
        data.comment,
        order_id=data.order_id,
    )
    if not review:
        raise HTTPException(status_code=400, detail="Failed to create review")
    return review


@router.get("/reviews", response_model=list[ReviewResponse])
def list_my_reviews(user_id: int = Depends(get_current_customer_id)):
    return CustomerService.list_my_reviews(user_id)


# ----- Notifications (schema has no is_read; list only) -----
@router.get("/notifications", response_model=list[NotificationResponse])
def list_notifications(limit: int = 50, user_id: int = Depends(get_current_customer_id)):
    return CustomerService.list_notifications(user_id, limit=limit)
