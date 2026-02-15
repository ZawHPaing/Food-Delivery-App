from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List
from .supabase_client import supabase

router = APIRouter(
    prefix="/delivery",
    tags=["Delivery History"]
)

class DeliveryHistoryItem(BaseModel):
    id: int
    restaurant_name: str
    customer_name: str
    earnings_cents: int
    delivered_at: str
    distance_km: float  # after adding this column

class DeliveryHistoryResponse(BaseModel):
    rider_id: int
    deliveries: List[DeliveryHistoryItem]

def fetch_rider_delivery_history(rider_id: int) -> List[DeliveryHistoryItem]:
    # Step 1: fetch deliveries
    deliveries_res = supabase.table("deliveries") \
        .select("""
            id,
            order_id,
            delivered_at,
            distance_km
        """) \
        .eq("rider_id", rider_id) \
        .eq("status", "delivered") \
        .execute()

    deliveries = deliveries_res.data or []
    if not deliveries:
        return []

    order_ids = [d["order_id"] for d in deliveries]

    # Step 2: fetch orders
    orders_res = supabase.table("orders") \
        .select("id, user_id, restaurant_id, delivery_fee_cents") \
        .in_("id", order_ids) \
        .execute()
    order_map = {o["id"]: o for o in orders_res.data}

    # Step 3: fetch restaurants
    restaurant_ids = list({o["restaurant_id"] for o in orders_res.data if o.get("restaurant_id")})
    restaurants_res = supabase.table("restaurants") \
        .select("id, name") \
        .in_("id", restaurant_ids) \
        .execute()
    restaurant_map = {r["id"]: r["name"] for r in restaurants_res.data}

    # Step 4: fetch customers
    user_ids = list({o["user_id"] for o in orders_res.data if o.get("user_id")})
    users_res = supabase.table("users") \
        .select("id, first_name, last_name") \
        .in_("id", user_ids) \
        .execute()
    user_map = {u["id"]: f"{u.get('first_name','')} {u.get('last_name','')}".strip() for u in users_res.data}

    # Step 5: build history
    history = []
    for d in deliveries:
        o = order_map.get(d["order_id"], {})
        history.append(DeliveryHistoryItem(
            id=d["id"],
            restaurant_name=restaurant_map.get(o.get("restaurant_id"), "Unknown"),
            customer_name=user_map.get(o.get("user_id"), "Unknown"),
            earnings_cents=o.get("delivery_fee_cents", 0),
            delivered_at=d.get("delivered_at"),
            distance_km=d.get("distance_km", 0.0)
        ))

    return history

@router.get("/history", response_model=DeliveryHistoryResponse)
def get_delivery_history(rider_id: int = Query(..., description="The ID of the rider")):
    """
    Get the completed delivery history for a rider, including earnings, delivered_at, and distance.
    """
    try:
        history = fetch_rider_delivery_history(rider_id)
        return {"rider_id": rider_id, "deliveries": history}
    except Exception as e:
        print(f"Supabase Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch delivery history")
