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


# ----- User login/register (customers & restaurant only; riders use /delivery/*) -----
@router.post("/user/login", response_model=UserLoginResponse)
def user_login(request: UserLoginRequest):
    """
    Login for customers and restaurant users only. Riders must use /delivery/login.
    """
    result = AuthService.authenticate_user_exclude_rider(request.email, request.password)
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Invalid credentials or this account is for delivery riders. Use the rider app to sign in.",
        )
    return result


@router.post("/user/register", response_model=UserSignUpResponse)
def user_register(request: UserSignUpRequest):
    """
    Register for customers and restaurant only. user_type must be "customer" or "restaurant".
    Riders must use the delivery signup flow.
    """
    if request.user_type and request.user_type.lower() == "rider":
        raise HTTPException(status_code=400, detail="Rider registration is not allowed here. Use the rider signup page.")
    # Allow only customer or restaurant; default to customer
    user_type = (request.user_type or "customer").lower()
    if user_type not in ("customer", "restaurant"):
        user_type = "customer"
    data = request.dict()
    data["user_type"] = user_type
    result = AuthService.create_user_account_user_only(data)
    if not result:
        raise HTTPException(status_code=400, detail="User already exists or invalid data")
    return result