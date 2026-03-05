from fastapi import APIRouter, HTTPException, Header, WebSocket, WebSocketDisconnect
from typing import Optional
from pydantic import BaseModel
from ..services.restaurant_service import RestaurantService
from ..core.security import decode_access_token
from ..core.websocket_manager import manager

router = APIRouter(prefix="/restaurant", tags=["Restaurant"])


class OrderStatusUpdate(BaseModel):
    status: str


def get_restaurant_user(authorization: Optional[str] = Header(None, alias="Authorization")) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("user_type") != "restaurant":
        raise HTTPException(status_code=403, detail="Not a restaurant account")
    return payload


@router.get("/profile")
def get_restaurant_profile(
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """Get the restaurant associated with the current logged-in restaurant user."""
    user = get_restaurant_user(authorization)
    rest = RestaurantService.get_restaurant_by_user_id(user["user_id"])
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found for this user")
    return rest


@router.get("/orders")
async def get_restaurant_orders(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    restaurant_id: Optional[int] = None,
):
    if restaurant_id is not None:
        return RestaurantService.get_orders_for_restaurant(restaurant_id)
    user = get_restaurant_user(authorization)
    rest = RestaurantService.get_restaurant_by_user_id(user["user_id"])
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found for this user")
    return RestaurantService.get_orders_for_restaurant(rest["id"])


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    restaurant_id: Optional[int] = None,
):
    if restaurant_id is not None:
        rid = restaurant_id
    else:
        user = get_restaurant_user(authorization)
        rest = RestaurantService.get_restaurant_by_user_id(user["user_id"])
        if not rest:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        rid = rest["id"]
    try:
        result = await RestaurantService.update_order_status(order_id, body.status, rid)
        if not result:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"success": True, "order": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.websocket("/ws/{restaurant_id}")
async def restaurant_websocket(websocket: WebSocket, restaurant_id: int):
    await manager.connect_restaurant(int(restaurant_id), websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_restaurant(int(restaurant_id))
