from fastapi import APIRouter, Query, HTTPException, WebSocket, WebSocketDisconnect
from typing import Optional
from ..models.delivery_models import (
    RiderLoginRequest, RiderLoginResponse,
    RiderSignUpRequest, RiderSignUpResponse,
    UpdateRiderStatusRequest, UpdateStatusResponse,
    DeliveryHistoryResponse, RiderProfileResponse,
    UpdateLocationRequest
)
from ..services.delivery_service import DeliveryService
from ..services.dispatch_service import DispatchService
from ..repositories.delivery_repo import DeliveryRepository
from ..core.websocket_manager import manager

router = APIRouter(prefix="/delivery", tags=["Delivery"])

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
@router.post("/location")
def update_rider_location(request: UpdateLocationRequest):
    """Update rider GPS coordinates"""
    success = DeliveryService.update_rider_location(
        request.rider_id, 
        request.latitude, 
        request.longitude
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update location")
    return {"success": True}

# ----- WebSockets & Dispatch -----

@router.websocket("/ws/{rider_user_id}")
async def rider_websocket(websocket: WebSocket, rider_user_id: int):
    """Rider WebSocket connection for real-time order requests."""
    await manager.connect(rider_user_id, websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(rider_user_id)

@router.post("/requests/{request_id}/respond")
async def respond_to_request(request_id: int, action: str, rider_id: int):
    """Rider accepts or rejects a dispatch request."""
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    success, msg = await DispatchService.handle_rider_response(rider_id, request_id, action)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
        
    return {"success": True, "message": msg}