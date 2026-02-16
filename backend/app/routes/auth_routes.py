from fastapi import APIRouter, HTTPException
from ..models.auth_models import UserLoginRequest, UserLoginResponse, UserSignUpRequest, UserSignUpResponse
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=UserLoginResponse)
def login(request: UserLoginRequest):
    """
    Generic login for all user types
    """
    result = AuthService.authenticate_user(request.email, request.password)
    if not result:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return result

@router.post("/login/rider", response_model=UserLoginResponse)
def rider_login(request: UserLoginRequest):
    """
    Login specifically for riders
    """
    result = AuthService.authenticate_user(request.email, request.password, expected_user_type="rider")
    if not result:
        raise HTTPException(status_code=400, detail="Invalid credentials or not a rider account")
    return result

@router.post("/login/customer", response_model=UserLoginResponse)
def customer_login(request: UserLoginRequest):
    """
    Login specifically for customers
    """
    result = AuthService.authenticate_user(request.email, request.password, expected_user_type="customer")
    if not result:
        raise HTTPException(status_code=400, detail="Invalid credentials or not a customer account")
    return result

@router.post("/signup", response_model=UserSignUpResponse)
def signup(request: UserSignUpRequest):
    """
    Generic signup for all user types
    """
    result = AuthService.create_user_account(request.dict())
    if not result:
        raise HTTPException(status_code=400, detail="User already exists or invalid data")
    return result