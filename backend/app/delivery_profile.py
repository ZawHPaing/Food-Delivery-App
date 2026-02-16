# from fastapi import APIRouter, Query, HTTPException
# from .supabase_client import supabase

# router = APIRouter(
#     prefix="/delivery",
#     tags=["Delivery"]
# )


# def fetch_user_and_rider(user: dict):
#     rider_res = supabase.table("riders") \
#         .select("""
#             id,
#             vehicle_type,
#             license_plate,
#             status,
#             city,
#             current_latitude,
#             current_longitude,
#             last_location_update
#         """) \
#         .eq("user_id", user["id"]) \
#         .execute()

#     rider = rider_res.data[0] if rider_res.data else None

#     deliveries = []

#     if rider:
#         deliveries_res = supabase.table("deliveries") \
#             .select("""
#                 id,
#                 order_id,
#                 status,
#                 picked_up_at,
#                 delivered_at,
#                 estimated_arrival_time
#             """) \
#             .eq("rider_id", rider["id"]) \
#             .execute()

#         deliveries = deliveries_res.data if deliveries_res.data else []

#         if deliveries:
#             order_ids = [d["order_id"] for d in deliveries]

#             orders_res = supabase.table("orders") \
#                 .select("id, delivery_fee_cents") \
#                 .in_("id", order_ids) \
#                 .execute()

#             # map order_id → delivery_fee
#             order_fee_map = {o["id"]: o["delivery_fee_cents"] for o in orders_res.data}

#             # add delivery_fee to each delivery
#             for d in deliveries:
#                 d["delivery_fee_cents"] = order_fee_map.get(d["order_id"], 0)

#     return {
#         "first_name": user.get("first_name"),
#         "last_name": user.get("last_name"),
#         "email": user.get("email"),
#         "phone": user.get("phone"),
#         "rider": rider,
#         "deliveries": deliveries
#     }

# @router.get("/profile")
# def get_profile(
#     username: str | None = Query(None),
#     email: str | None = Query(None)
# ):
#     try:
#         if email:
#             user_res = supabase.table("users") \
#                 .select("id, email, first_name, last_name, phone") \
#                 .eq("email", email) \
#                 .execute()

#             if user_res.data:
#                 user = user_res.data[0]
#                 return fetch_user_and_rider(user)

#         if username:
#             user_res = supabase.table("users") \
#                 .select("id, email, first_name, last_name, phone") \
#                 .ilike("email", f"%{username}%") \
#                 .execute()

#             if user_res.data:
#                 user = user_res.data[0]
#                 return fetch_user_and_rider(user)

#     except Exception as e:
#         print(f"Supabase Error: {e}")

#     # Nothing found
#     raise HTTPException(status_code=404, detail="User not found")

# @router.post("/status")
# def update_rider_status(rider_id: int, status: str):
#     """
#     Update the rider's availability status.
#     Status must be either "available" or "unavailable".
#     """
#     if status not in ["available", "unavailable"]:
#         raise HTTPException(status_code=400, detail="Invalid status value")

#     try:
#         res = supabase.table("riders") \
#             .update({"status": status}) \
#             .eq("id", rider_id) \
#             .execute()

#         if res.count == 0:
#             raise HTTPException(status_code=404, detail="Rider not found")

#         return {"success": True, "status": status}

#     except Exception as e:
#         print(f"Supabase Error: {e}")
#         raise HTTPException(status_code=500, detail="Failed to update status")
