from fastapi import APIRouter, Query, HTTPException
from .supabase_client import supabase

router = APIRouter(
    prefix="/delivery",
    tags=["Delivery"]
)

@router.get("/profile")
def get_profile(username: str | None = Query(None), email: str | None = Query(None)):
    try:
        # 1. Try Email Lookup
        if email:
            user_res = supabase.table("users").select("id, email, first_name, last_name, phone").eq("email", email).execute()
            
            if user_res.data:
                user = user_res.data[0]
                # Try to get rider info, but don't fail if they aren't a rider yet
                rider_res = supabase.table("riders").select("vehicle_type, license_plate, status").eq("user_id", user["id"]).execute()
                rider = rider_res.data[0] if rider_res.data else None
                
                return {
                    "first_name": user.get("first_name"),
                    "last_name": user.get("last_name"),
                    "email": user.get("email"),
                    "phone": user.get("phone"),
                    "rider": rider,
                }
        
        # 2. Try Username Lookup (if email failed or wasn't provided)
        if username:
            user_res = supabase.table("users").select("id, email, first_name, last_name, phone").ilike("email", f"%{username}%").execute()
            if user_res.data:
                # ... same logic as above ...
                user = user_res.data[0]
                return { "first_name": user.get("first_name"), "email": user.get("email"), "rider": None }

    except Exception as e:
        # PRINT THE ERROR so you can see it in your terminal!
        print(f"Supabase Error: {e}")
        pass 

    # If we reach here, no user was found in the DB — return 404 so the
    # frontend can fall back to the local auth state instead of receiving
    # mock data.
    raise HTTPException(status_code=404, detail="User not found")