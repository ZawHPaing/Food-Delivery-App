from fastapi import APIRouter, Query, HTTPException, WebSocket
from typing import Optional
from pydantic import BaseModel
from ..models.delivery_models import (
    RiderLoginRequest, RiderLoginResponse,
    RiderSignUpRequest, RiderSignUpResponse,
    UpdateRiderStatusRequest, UpdateStatusResponse,
    DeliveryHistoryResponse, RiderProfileResponse
)
from ..services.delivery_service import DeliveryService
from ..services.dispatch_service import DispatchService
from ..repositories.delivery_repo import DeliveryRepository
from ..repositories.dispatch_repo import DispatchRepository
from ..core.websocket_manager import manager
import logging

log = logging.getLogger(__name__)

router = APIRouter(prefix="/delivery", tags=["Delivery"])


@router.websocket("/ws/{user_id}")
async def rider_websocket(websocket: WebSocket, user_id: int):
    """Rider WebSocket: register connection so dispatch can send NEW_ORDER_REQUEST."""
    log.info("[delivery] rider WebSocket connected user_id=%s", user_id)
    await manager.connect(user_id, websocket)
    try:
        await DispatchService.send_pending_requests_for_rider(user_id, websocket)
        while True:
            await websocket.receive_text()
    except Exception as e:
        log.info("[delivery] rider WebSocket closed user_id=%s: %s", user_id, e)
    finally:
        manager.disconnect(user_id)
        log.info("[delivery] rider WebSocket disconnected user_id=%s", user_id)


@router.get("/debug/riders")
def debug_riders():
    """Inspect riders and their status (for debugging dispatch)."""
    try:
        from ..supabase_client import supabase
        resp = supabase.table("riders").select("id, user_id, status, city").execute()
        riders = resp.data or []
        available = [r for r in riders if (r.get("status") or "").lower() == "available"]
        return {
            "total": len(riders),
            "available_count": len(available),
            "riders": riders,
            "hint": "Rider must have status='available' to receive orders. Toggle Available in the app.",
        }
    except Exception as e:
        log.exception("debug/riders failed")
        return {"error": str(e), "riders": []}


@router.get("/debug/ws")
def debug_ws():
    """List rider user_ids currently connected via WebSocket (for debugging)."""
    from ..core.websocket_manager import manager
    connected = list(manager.active_connections.keys())
    return {
        "connected_rider_user_ids": sorted(connected),
        "count": len(connected),
        "hint": "When rider app is Available and open, their user_id (e.g. 41) should appear here.",
    }


@router.post("/login", response_model=RiderLoginResponse)
def rider_login(request: RiderLoginRequest):
    """Login for riders"""
    result = DeliveryService.authenticate_rider(request.email, request.password)
    if not result:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return result

@router.post("/sign_up", response_model=RiderSignUpResponse)
def rider_sign_up(request: RiderSignUpRequest):
    """Sign up a new rider"""
    result = DeliveryService.create_rider_account(request.dict())
    if not result:
        raise HTTPException(status_code=400, detail="Failed to create rider account")
    return result

@router.get("/history", response_model=DeliveryHistoryResponse)
def get_delivery_history(rider_id: int = Query(..., description="The ID of the rider")):
    """Get completed delivery history for a rider"""
    try:
        history = DeliveryService.get_delivery_history(rider_id)
        return {"rider_id": rider_id, "deliveries": history}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch delivery history")

@router.get("/profile", response_model=RiderProfileResponse)
def get_profile(
    username: Optional[str] = Query(None),
    email: Optional[str] = Query(None)
):
    """Get rider profile by email or username"""
    try:
        user = None
        if email:
            user = DeliveryRepository.find_user_by_email(email)
        elif username:
            # This would need a different repository method
            pass
        
        if user:
            return DeliveryService.get_rider_profile(user)
        
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@router.post("/status", response_model=UpdateStatusResponse)
def update_rider_status(request: UpdateRiderStatusRequest):
    """Update rider availability status"""
    success = DeliveryService.update_rider_status(request.rider_id, request.status)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update status")
    return {"success": True, "status": request.status}


class RiderLocationBody(BaseModel):
    rider_id: int
    latitude: float
    longitude: float

@router.post("/location")
def update_rider_location(body: RiderLocationBody):
    """Update rider GPS location (for dispatch and map)."""
    success = DeliveryRepository.update_rider_location(body.rider_id, body.latitude, body.longitude)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update location")
    return {"success": True}


@router.get("/requests")
def get_pending_requests(rider_id: int = Query(..., description="Rider ID")):
    """Get pending dispatch requests for this rider (for polling when WebSocket may have missed)."""
    pending = DispatchRepository.get_pending_requests_for_rider(rider_id)
    out = []
    for req in pending:
        order_id = req.get("order_id")
        if not order_id:
            continue
        order_details = DispatchRepository.get_order_details(order_id)
        if not order_details:
            continue
        payload = DispatchService._build_request_payload(order_details, req, distance=0.0)
        out.append(payload)
    return {"requests": out}


@router.post("/requests/{request_id}/respond")
async def respond_to_dispatch_request(
    request_id: int,
    action: str = Query(..., description="accept or reject"),
    rider_id: int = Query(..., description="Rider ID (must match the request)"),
):
    """
    Rider accepts or rejects a delivery request.
    On accept: creates delivery, sets order status to rider_assigned, notifies customer.
    """
    success, customer_user_id, err = DeliveryService.respond_to_dispatch_request(
        request_id, rider_id, action
    )
    if not success:
        raise HTTPException(status_code=400, detail=err or "Failed to respond")
    # Notify customer so Order Progress updates in real time
    if customer_user_id is not None:
        from ..repositories.dispatch_repo import DispatchRepository
        req = DispatchRepository.get_dispatch_request_by_id(request_id)
        if req:
            order_id = req.get("order_id")
            await manager.send_to_customer(
                int(customer_user_id),
                {"type": "ORDER_STATUS_UPDATE", "order_id": order_id, "status": "rider_assigned"},
            )
    return {"success": True, "action": action}


@router.post("/deliveries/{delivery_id}/pickup")
async def mark_picked_up(
    delivery_id: int,
    rider_id: int = Query(..., description="Rider ID"),
):
    """Rider marks order as picked up from restaurant. Updates customer Order Progress to 'On the Way'."""
    success, order_id, customer_user_id, err = DeliveryService.update_delivery_progress(
        delivery_id, rider_id, "picked_up"
    )
    if not success:
        raise HTTPException(status_code=400, detail=err or "Failed to update")
    if customer_user_id is not None:
        await manager.send_to_customer(
            int(customer_user_id),
            {"type": "ORDER_STATUS_UPDATE", "order_id": order_id, "status": "picked_up"},
        )
    return {"success": True, "status": "picked_up"}


@router.post("/deliveries/{delivery_id}/deliver")
async def mark_delivered(
    delivery_id: int,
    rider_id: int = Query(..., description="Rider ID"),
):
    """Rider marks order as delivered. Updates customer Order Progress to 'Delivered'."""
    success, order_id, customer_user_id, err = DeliveryService.update_delivery_progress(
        delivery_id, rider_id, "delivered"
    )
    if not success:
        raise HTTPException(status_code=400, detail=err or "Failed to update")
    if customer_user_id is not None:
        await manager.send_to_customer(
            int(customer_user_id),
            {"type": "ORDER_STATUS_UPDATE", "order_id": order_id, "status": "delivered"},
        )
    return {"success": True, "status": "delivered"}