from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from datetime import datetime
from .supabase_client import supabase
from app.core.security import hash_password, create_access_token
import random

router = APIRouter(
    prefix="/delivery",
    tags=["Delivery"]
)

# Pydantic model for rider signup
class RiderSignUpRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str
    city: str
    vehicle: str
    license_plate: str

@router.post("/sign_up")
def rider_sign_up(request: RiderSignUpRequest):
    hashed_pwd = hash_password(request.password)

    # 1️⃣ Insert into users table
    user_data = {
        "email": request.email,
        "password_hash": hashed_pwd,
        "first_name": request.first_name,
        "last_name": request.last_name,
        "phone": request.phone,
        "user_type": "rider",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    user_response = supabase.table("users").insert(user_data).execute()

    if not user_response.data:
        return {"error": "Failed to create user"}

    user_id = user_response.data[0]["id"]

    # 2️⃣ Insert into riders table
    rider_data = {
        "user_id": user_id,
        "vehicle_type": request.vehicle,
        "license_plate": request.license_plate,
        "status": "inactive",
        "current_latitude": None,
        "current_longitude": None,
        "last_location_update": None,
        "city": request.city
    }

    rider_response = supabase.table("riders").insert(rider_data).execute()

    if not rider_response.data:
        return {"error": "Failed to create rider"}

    token = create_access_token({"email": request.email})

    return {
        "message": "Rider signup successful!",
        "user": user_response.data,
        "rider": rider_response.data,
        "access_token": token
    }
