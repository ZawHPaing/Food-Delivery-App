from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
from typing import List, Optional
from app.services.consumer_service import ConsumerService
from app.supabase_client import supabase
from app.core.websocket_manager import manager
from app.repositories.voucher_repo import VoucherRepository
from app.models.consumer import (
    RestaurantResponse,
    MenuItemResponse,
    OrderCreate,
    OrderResponse,
)

router = APIRouter(prefix="/consumer", tags=["Consumer"])


@router.get("/vouchers/validate")
def validate_voucher(
    code: str = Query(...),
    subtotal_cents: int = Query(...),
    restaurant_id: Optional[int] = Query(None),
):
    """Public: validate a voucher code for subtotal/restaurant. Used by guest checkout."""
    voucher, err = VoucherRepository.validate(code, subtotal_cents, restaurant_id)
    if err:
        return {"valid": False, "discount_cents": 0, "message": err}
    return {"valid": True, "discount_cents": voucher["discount_cents"], "message": "Voucher applied"}


@router.get("/restaurants", response_model=List[RestaurantResponse])
async def get_restaurants(cuisine: str = None, search: str = None):
    try:
        restaurants = ConsumerService.get_restaurants(cuisine, search)
        return restaurants
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(restaurant_id: int):
    try:
        restaurant = ConsumerService.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        return restaurant
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/popular-items", response_model=List[MenuItemResponse])
async def get_popular_items():
    try:
        items = ConsumerService.get_popular_items()
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/restaurants/{restaurant_id}/menu")
async def get_menu(restaurant_id: int):
    try:
        restaurant = ConsumerService.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        menu_items = ConsumerService.get_menu_items(restaurant_id)
        categories = {}
        for item in menu_items:
            cat = item.get("category", "General")
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item)
        menus = [{"name": cat, "items": items} for cat, items in categories.items()]
        if not menus:
            menus = [{"name": "Menu", "items": []}]
        result = {**restaurant, "menus": menus}
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate):
    try:
        order = ConsumerService.create_order(order_data.model_dump())
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Order Tracking ----------


@router.get("/orders/{order_id}/track")
async def track_order(order_id: int):
    """
    Get full tracking info for an order:
    - Current status
    - Restaurant name
    - Rider info (if assigned)
    - Delivery details
    """
    try:
        order_resp = supabase.table("orders").select(
            "*, restaurants(name, latitude, longitude)"
        ).eq("id", order_id).execute()

        if not order_resp.data:
            raise HTTPException(status_code=404, detail="Order not found")

        order = order_resp.data[0]

        items_resp = supabase.table("order_items").select(
            "*, menu_items(name, image_url)"
        ).eq("order_id", order_id).execute()
        order["items"] = items_resp.data or []

        delivery_resp = supabase.table("deliveries").select("*").eq(
            "order_id", order_id
        ).execute()

        if delivery_resp.data:
            delivery = delivery_resp.data[0]
            order["delivery"] = delivery
            rider_resp = supabase.table("riders").select(
                "*, users(first_name, last_name, phone)"
            ).eq("id", delivery["rider_id"]).execute()
            if rider_resp.data:
                order["rider"] = rider_resp.data[0]

        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Customer WebSocket ----------


@router.websocket("/ws/{user_id}")
async def customer_websocket(websocket: WebSocket, user_id: int):
    """Customer WebSocket for real-time order status updates."""
    await manager.connect_customer(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_customer(user_id)
