from pydantic import BaseModel, EmailStr
from typing import Optional

# Request Models
class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserSignUpRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str
    user_type: str  # "rider", "customer", "restaurant"

# Response Models
class UserLoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    email: EmailStr
    user_type: str
    user_id: int

class UserSignUpResponse(BaseModel):
    message: str
    user: dict
    access_token: str