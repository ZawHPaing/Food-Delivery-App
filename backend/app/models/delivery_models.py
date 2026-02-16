from pydantic import BaseModel, EmailStr
from typing import List, Optional

# Request Models
class RiderLoginRequest(BaseModel):
    email: EmailStr
    password: str

class RiderSignUpRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str
    city: str
    vehicle: str
    license_plate: str

class UpdateRiderStatusRequest(BaseModel):
    rider_id: int
    status: str

class UpdateRiderLocationRequest(BaseModel):
    rider_id: int
    current_latitude: float
    current_longitude: float

# Response Models
class RiderLoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    email: EmailStr

class RiderSignUpResponse(BaseModel):
    message: str
    user: dict
    rider: dict
    access_token: str

class DeliveryHistoryItem(BaseModel):
    id: int
    restaurant_name: str
    customer_name: str
    earnings_cents: int
    delivered_at: str
    distance_km: float

class DeliveryHistoryResponse(BaseModel):
    rider_id: int
    deliveries: List[DeliveryHistoryItem]

class RiderProfileResponse(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    rider: Optional[dict]
    deliveries: List[dict]

class UpdateStatusResponse(BaseModel):
    success: bool
    status: str

class UpdateRiderLocationResponse(BaseModel):
    success: bool
    rider_id: int
    current_latitude: float
    current_longitude: float