# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel, EmailStr
# from .supabase_client import supabase
# from app.core.security import verify_password, create_access_token

# router = APIRouter(
#     prefix="/delivery",
#     tags=["Delivery"]
# )

# class RiderLoginRequest(BaseModel):
#     email: EmailStr
#     password: str

# @router.post("/login")
# def rider_login(request: RiderLoginRequest):

#     # 1️⃣ Find user by email
#     response = supabase.table("users") \
#         .select("*") \
#         .eq("email", request.email) \
#         .single() \
#         .execute()

#     if not response.data:
#         raise HTTPException(status_code=400, detail="Invalid credentials")

#     user = response.data

#     # 2️⃣ Ensure it's a rider account
#     if user["user_type"] != "rider":
#         raise HTTPException(status_code=403, detail="Not a rider account")

#     # 3️⃣ Verify password
#     if not verify_password(request.password, user["password_hash"]):
#         raise HTTPException(status_code=400, detail="Invalid credentials")

#     # 4️⃣ Create token with email
#     token = create_access_token({
#         "email": user["email"]
#     })

#     return {
#         "message": "Login successful",
#         "access_token": token,
#         "token_type": "bearer",
#         "email": user["email"]  # ✅ add this
#     }

