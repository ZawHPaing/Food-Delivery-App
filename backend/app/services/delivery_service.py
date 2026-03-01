from typing import List, Optional, Tuple
from ..repositories.delivery_repo import DeliveryRepository
from ..repositories.dispatch_repo import DispatchRepository
from ..repositories.customer_repo import CustomerRepository
from ..models.delivery_models import DeliveryHistoryItem, RiderProfileResponse
from ..core.security import hash_password, verify_password, create_access_token
from ..supabase_client import supabase

class DeliveryService:
    
    @staticmethod
    def authenticate_rider(email: str, password: str) -> Optional[dict]:
        """Authenticate a rider and return token data"""
        user = DeliveryRepository.find_user_by_email(email)
        
        if not user or user["user_type"] != "rider":
            return None
        
        if not verify_password(password, user["password_hash"]):
            return None
        
        token = create_access_token({"email": user["email"]})
        
        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "email": user["email"]
        }
    
    @staticmethod
    def create_rider_account(signup_data: dict) -> Optional[dict]:
        """Create a new rider account"""
        from datetime import datetime
        
        # Hash password
        hashed_pwd = hash_password(signup_data["password"])
        
        # Create user
        user_data = {
            "email": signup_data["email"],
            "password_hash": hashed_pwd,
            "first_name": signup_data["first_name"],
            "last_name": signup_data["last_name"],
            "phone": signup_data["phone"],
            "user_type": "rider",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        user = DeliveryRepository.create_user(user_data)
        if not user:
            return None
        
        # Create rider
        rider_data = {
            "user_id": user["id"],
            "vehicle_type": signup_data["vehicle"],
            "license_plate": signup_data["license_plate"],
            "status": "inactive",
            "current_latitude": None,
            "current_longitude": None,
            "last_location_update": None,
            "city": signup_data["city"]
        }
        
        rider = DeliveryRepository.create_rider(rider_data)
        if not rider:
            return None
        
        token = create_access_token({"email": user["email"]})
        
        return {
            "message": "Rider signup successful!",
            "user": user,
            "rider": rider,
            "access_token": token
        }
    
    @staticmethod
    def respond_to_dispatch_request(
        request_id: int, rider_id: int, action: str
    ) -> Tuple[bool, Optional[int], str]:
        """
        Rider accepts or rejects a dispatch request.
        Returns (success, customer_user_id_for_notify, error_message).
        On accept: creates delivery, sets order status to rider_assigned, updates dispatch status.
        """
        req = DispatchRepository.get_dispatch_request_by_id(request_id)
        if not req:
            return False, None, "Request not found"
        if str(req.get("status")) != "pending":
            return False, None, "Request already responded"
        if int(req.get("rider_id", 0)) != int(rider_id):
            return False, None, "Rider does not match request"
        order_id = int(req["order_id"])

        if action == "reject":
            DispatchRepository.update_dispatch_status(request_id, "rejected")
            return True, None, ""

        if action != "accept":
            return False, None, "Invalid action"

        # Get order to find customer user_id for WebSocket notify
        order_row = supabase.table("orders").select("user_id").eq("id", order_id).maybe_single().execute()
        order_data = getattr(order_row, "data", None)
        customer_user_id = None
        if order_data:
            customer_user_id = order_data.get("user_id") if isinstance(order_data, dict) else (order_data[0].get("user_id") if isinstance(order_data, list) and order_data else None)

        # Create delivery row (order_id, rider_id)
        delivery = DeliveryRepository.create_delivery(order_id, rider_id, status="assigned")
        if not delivery:
            return False, None, "Failed to create delivery"

        # Update order status so customer Order Progress shows "Rider Assigned"
        from datetime import datetime
        supabase.table("orders").update({"status": "rider_assigned", "updated_at": datetime.utcnow().isoformat()}).eq("id", order_id).execute()

        # Mark dispatch request as accepted and expire other riders' pending requests for this order
        DispatchRepository.update_dispatch_status(request_id, "accepted")
        DispatchRepository.expire_other_requests_for_order(order_id, request_id)

        return True, customer_user_id, ""

    @staticmethod
    def update_delivery_progress(
        delivery_id: int, rider_id: int, status: str
    ) -> Tuple[bool, Optional[int], Optional[int], str]:
        """
        Rider marks delivery as picked_up or delivered.
        Returns (success, order_id, customer_user_id, error).
        """
        from datetime import datetime
        delivery = DeliveryRepository.get_delivery_by_id(delivery_id)
        if not delivery or int(delivery.get("rider_id", 0)) != int(rider_id):
            return False, None, None, "Delivery not found or access denied"
        order_id = int(delivery["order_id"])
        order_row = supabase.table("orders").select("user_id").eq("id", order_id).maybe_single().execute()
        order_data = getattr(order_row, "data", None)
        customer_user_id = None
        if order_data:
            customer_user_id = order_data.get("user_id") if isinstance(order_data, dict) else (order_data[0].get("user_id") if isinstance(order_data, list) and order_data else None)

        now = datetime.utcnow().isoformat()
        if status == "picked_up":
            DeliveryRepository.update_delivery_status(
                delivery_id, rider_id, "picked_up", picked_up_at=now
            )
            supabase.table("orders").update({"status": "picked_up", "updated_at": now}).eq("id", order_id).execute()
        elif status == "delivered":
            DeliveryRepository.update_delivery_status(
                delivery_id, rider_id, "delivered", delivered_at=now
            )
            supabase.table("orders").update({"status": "delivered", "updated_at": now}).eq("id", order_id).execute()
            # Mark COD payment as paid (cash collected by rider)
            CustomerRepository.mark_payment_paid_for_order(order_id)
        else:
            return False, None, None, "Invalid status"
        return True, order_id, customer_user_id, ""

    @staticmethod
    def get_delivery_history(rider_id: int) -> List[DeliveryHistoryItem]:
        """Get formatted delivery history for a rider"""
        # Get deliveries
        deliveries = DeliveryRepository.get_delivery_history(rider_id)
        if not deliveries:
            return []
        
        # Get related data
        order_ids = [d["order_id"] for d in deliveries]
        orders = DeliveryRepository.get_orders_by_ids(order_ids)
        
        restaurant_ids = list({o.get("restaurant_id") for o in orders.values() if o.get("restaurant_id")})
        restaurants = DeliveryRepository.get_restaurants_by_ids(restaurant_ids)
        
        user_ids = list({o.get("user_id") for o in orders.values() if o.get("user_id")})
        users = DeliveryRepository.get_users_by_ids(user_ids)
        
        # Build history items
        history = []
        for d in deliveries:
            order = orders.get(d["order_id"], {})
            history.append(DeliveryHistoryItem(
                id=d["id"],
                restaurant_name=restaurants.get(order.get("restaurant_id"), "Unknown"),
                customer_name=users.get(order.get("user_id"), "Unknown"),
                earnings_cents=order.get("delivery_fee_cents", 0),
                delivered_at=d.get("delivered_at"),
                distance_km=d.get("distance_km", 0.0)
            ))
        
        return history
    
    @staticmethod
    def get_rider_profile(user: dict) -> dict:
        """Get complete rider profile with deliveries"""
        rider = DeliveryRepository.get_rider_by_user_id(user["id"])
        deliveries = []
        
        cash_collected_cents = 0
        if rider:
            deliveries = DeliveryRepository.get_rider_deliveries(rider["id"])
            
            if deliveries:
                order_ids = [d["order_id"] for d in deliveries]
                orders = DeliveryRepository.get_orders_by_ids(order_ids)
                payments_by_order = CustomerRepository.get_payments_by_order_ids(order_ids)
                
                for d in deliveries:
                    order = orders.get(d["order_id"], {})
                    d["delivery_fee_cents"] = order.get("delivery_fee_cents", 0)
                    # Cash on delivery: sum order total for delivered orders paid in cash
                    if (d.get("status") == "delivered"):
                        pay = payments_by_order.get(d["order_id"], {})
                        if (pay.get("payment_method") or "").lower() == "cash":
                            cash_collected_cents += order.get("total_cents", 0)
        
        return {
            "id": user.get("id"),
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "rider": rider,
            "deliveries": deliveries,
            "cash_collected_cents": cash_collected_cents,
        }
    
    @staticmethod
    def update_rider_status(rider_id: int, status: str) -> bool:
        """Update rider status"""
        if status not in ["available", "unavailable"]:
            return False
        return DeliveryRepository.update_rider_status(rider_id, status)