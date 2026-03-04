from typing import List, Optional, Dict, Any
from ..repositories.admin_order_repo import AdminOrderRepository
from datetime import datetime


class AdminOrderService:

    @staticmethod
    def get_orders(
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        restaurant_id: Optional[int] = None,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get orders with pagination and filters"""
        try:
            result = AdminOrderRepository.get_orders(
                page=page,
                per_page=per_page,
                status=status,
                restaurant_id=restaurant_id,
                user_id=user_id,
                start_date=start_date,
                end_date=end_date
            )
            
            # Format orders for response
            orders = []
            for order in result["orders"]:
                formatted_order = AdminOrderService._format_order_response(order)
                orders.append(formatted_order)
            
            return {
                "orders": orders,
                "total_count": result["total_count"],
                "page": result["page"],
                "per_page": result["per_page"]
            }
        except Exception as e:
            print(f"Error in get_orders: {e}")
            return {
                "orders": [],
                "total_count": 0,
                "page": page,
                "per_page": per_page
            }

    @staticmethod
    def get_order_by_id(order_id: int) -> Optional[Dict]:
        """Get single order by ID"""
        try:
            order = AdminOrderRepository.get_order_by_id(order_id)
            if order:
                return AdminOrderService._format_order_response(order)
            return None
        except Exception as e:
            print(f"Error in get_order_by_id for order {order_id}: {e}")
            return None

    @staticmethod
    def update_order_status(order_id: int, new_status: str) -> Optional[Dict]:
        """Update order status"""
        allowed_statuses = [
            "pending", "confirmed", "preparing", "ready", 
            "rider_assigned", "picked_up", "delivered", "cancelled"
        ]
        
        if new_status not in allowed_statuses:
            print(f"Invalid status: {new_status}")
            return None

        try:
            # Check if order exists
            existing = AdminOrderRepository.get_order_by_id(order_id)
            if not existing:
                return None
            
            # Update status
            updated = AdminOrderRepository.update_order_status(order_id, new_status)
            if updated:
                # Get full order details for response
                full_order = AdminOrderRepository.get_order_by_id(order_id)
                if full_order:
                    return AdminOrderService._format_order_response(full_order)
            return None
        except Exception as e:
            print(f"Error in update_order_status for order {order_id}: {e}")
            return None

    @staticmethod
    def delete_order(order_id: int) -> bool:
        """Delete an order"""
        try:
            # Check if order exists
            existing = AdminOrderRepository.get_order_by_id(order_id)
            if not existing:
                return False
            
            return AdminOrderRepository.delete_order(order_id)
        except Exception as e:
            print(f"Error in delete_order for order {order_id}: {e}")
            return False

    @staticmethod
    def get_order_stats() -> Dict[str, Any]:
        """Get order statistics"""
        try:
            return AdminOrderRepository.get_order_stats()
        except Exception as e:
            print(f"Error in get_order_stats: {e}")
            return {
                "total_orders": 0,
                "total_revenue_cents": 0,
                "today_orders": 0,
                "today_revenue_cents": 0,
                "status_breakdown": {},
                "top_restaurants": []
            }

    @staticmethod
    def _format_order_response(order: Dict) -> Dict:
        """Format raw order data for API response"""
        customer_name = None
        customer_email = None
        customer_phone = None
        restaurant_name = None

        # Extract customer info
        if order.get("users"):
            user = order["users"]
            if isinstance(user, dict):
                first = user.get("first_name", "")
                last = user.get("last_name", "")
                customer_name = f"{first} {last}".strip() or None
                customer_email = user.get("email")
                customer_phone = user.get("phone")
        elif order.get("user_id"):
            # If we only have user_id, try to fetch user
            try:
                from ..repositories.admin_user_repo import AdminUserRepository
                user = AdminUserRepository.get_user_by_id(order["user_id"])
                if user:
                    customer_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or None
                    customer_email = user.get("email")
                    customer_phone = user.get("phone")
            except:
                pass

        # Extract restaurant name
        if order.get("restaurants"):
            restaurant = order["restaurants"]
            if isinstance(restaurant, dict):
                restaurant_name = restaurant.get("name")

        return {
            "id": order["id"],
            "user_id": order["user_id"],
            "restaurant_id": order.get("restaurant_id"),
            "status": order["status"],
            "subtotal_cents": order["subtotal_cents"],
            "tax_cents": order["tax_cents"],
            "delivery_fee_cents": order["delivery_fee_cents"],
            "total_cents": order["total_cents"],
            "delivery_address": order.get("delivery_address"),
            "delivery_latitude": order.get("delivery_latitude"),
            "delivery_longitude": order.get("delivery_longitude"),
            "created_at": order["created_at"],
            "updated_at": order["updated_at"],
            "customer_name": customer_name,
            "customer_email": customer_email,
            "customer_phone": customer_phone,
            "restaurant_name": restaurant_name,
            "items": order.get("items", [])
        }