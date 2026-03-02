from typing import List, Optional, Dict, Any
from ..supabase_client import supabase
from datetime import datetime, timedelta


class AdminOrderRepository:

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
            # Build query
            query = supabase.table("orders").select(
                "*, users!orders_user_id_fkey(first_name, last_name, email, phone), restaurants!orders_restaurant_id_fkey(name)"
            )

            # Apply filters
            if status:
                query = query.eq("status", status)
            
            if restaurant_id:
                query = query.eq("restaurant_id", restaurant_id)
            
            if user_id:
                query = query.eq("user_id", user_id)
            
            if start_date:
                query = query.gte("created_at", start_date.isoformat())
            
            if end_date:
                query = query.lte("created_at", end_date.isoformat())

            # Get total count
            count_query = supabase.table("orders").select("*", count="exact", head=True)
            if status:
                count_query = count_query.eq("status", status)
            if restaurant_id:
                count_query = count_query.eq("restaurant_id", restaurant_id)
            if user_id:
                count_query = count_query.eq("user_id", user_id)
            
            count_response = count_query.execute()
            total_count = count_response.count if hasattr(count_response, 'count') else 0

            # Get paginated results
            offset = (page - 1) * per_page
            response = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()
            
            orders = response.data or []

            # Get order items for each order
            if orders:
                order_ids = [order["id"] for order in orders]
                items_response = supabase.table("order_items").select(
                    "*, menu_items!order_items_menu_item_id_fkey(name)"
                ).in_("order_id", order_ids).execute()
                
                items_by_order = {}
                for item in items_response.data or []:
                    order_id = item["order_id"]
                    if order_id not in items_by_order:
                        items_by_order[order_id] = []
                    
                    # Format item with menu item name if available
                    item_data = {
                        "id": item["id"],
                        "order_id": item["order_id"],
                        "menu_item_id": item["menu_item_id"],
                        "quantity": item["quantity"],
                        "price_cents": item["price_cents"],
                        "special_instructions": item.get("special_instructions"),
                        "item_name": item.get("menu_items", {}).get("name") if item.get("menu_items") else None
                    }
                    items_by_order[order_id].append(item_data)
                
                # Attach items to orders
                for order in orders:
                    order["items"] = items_by_order.get(order["id"], [])

            return {
                "orders": orders,
                "total_count": total_count,
                "page": page,
                "per_page": per_page
            }

        except Exception as e:
            print(f"Error getting orders: {e}")
            return {
                "orders": [],
                "total_count": 0,
                "page": page,
                "per_page": per_page
            }

    @staticmethod
    def get_order_by_id(order_id: int) -> Optional[Dict]:
        """Get single order by ID with all details"""
        try:
            response = supabase.table("orders").select(
                "*, users!orders_user_id_fkey(first_name, last_name, email, phone), restaurants!orders_restaurant_id_fkey(name)"
            ).eq("id", order_id).single().execute()
            
            if not response.data:
                return None
            
            order = response.data
            
            # Get order items
            items_response = supabase.table("order_items").select(
                "*, menu_items!order_items_menu_item_id_fkey(name)"
            ).eq("order_id", order_id).execute()
            
            items = []
            for item in items_response.data or []:
                items.append({
                    "id": item["id"],
                    "order_id": item["order_id"],
                    "menu_item_id": item["menu_item_id"],
                    "quantity": item["quantity"],
                    "price_cents": item["price_cents"],
                    "special_instructions": item.get("special_instructions"),
                    "item_name": item.get("menu_items", {}).get("name") if item.get("menu_items") else None
                })
            
            order["items"] = items
            return order

        except Exception as e:
            print(f"Error getting order {order_id}: {e}")
            return None

    @staticmethod
    def update_order_status(order_id: int, new_status: str) -> Optional[Dict]:
        """Update order status"""
        try:
            response = supabase.table("orders").update({
                "status": new_status,
                "updated_at": datetime.now().isoformat()
            }).eq("id", order_id).execute()
            
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error updating order {order_id} status: {e}")
            return None

    @staticmethod
    def delete_order(order_id: int) -> bool:
        """Delete an order (cascade will delete order_items)"""
        try:
            response = supabase.table("orders").delete().eq("id", order_id).execute()
            count = getattr(response, "count", None)
            if count is not None:
                return count > 0
            data = getattr(response, "data", None)
            return bool(data and len(data) > 0)
        except Exception as e:
            print(f"Error deleting order {order_id}: {e}")
            return False

    @staticmethod
    def get_order_stats() -> Dict[str, Any]:
        """Get order statistics"""
        try:
            # Get all orders counts by status
            orders_response = supabase.table("orders").select("status, total_cents", count="exact").execute()
            
            # Today's orders
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            tomorrow_start = today_start + timedelta(days=1)
            
            today_orders_response = supabase.table("orders").select("total_cents", count="exact").gte(
                "created_at", today_start.isoformat()
            ).lt("created_at", tomorrow_start.isoformat()).execute()
            
            # Calculate stats
            total_orders = 0
            status_counts = {
                "pending": 0,
                "confirmed": 0,
                "preparing": 0,
                "ready": 0,
                "rider_assigned": 0,
                "picked_up": 0,
                "delivered": 0,
                "cancelled": 0
            }
            total_revenue = 0
            today_revenue = 0
            
            # Process all orders
            for order in orders_response.data or []:
                status = order.get("status", "pending")
                if status in status_counts:
                    status_counts[status] += 1
                
                total_orders += 1
                total_revenue += order.get("total_cents", 0)
            
            # Process today's orders
            for order in today_orders_response.data or []:
                today_revenue += order.get("total_cents", 0)
            
            # Get orders by restaurant (top 5)
            restaurant_orders_query = supabase.table("orders").select(
                "restaurant_id, restaurants(name), count"
            ).not_.is_("restaurant_id", "null").group_by("restaurant_id, restaurants.name").order("count", desc=True).limit(5).execute()
            
            return {
                "total_orders": total_orders,
                "total_revenue_cents": total_revenue,
                "today_orders": today_orders_response.count or 0,
                "today_revenue_cents": today_revenue,
                "status_breakdown": status_counts,
                "top_restaurants": restaurant_orders_response.data or []
            }
            
        except Exception as e:
            print(f"Error getting order stats: {e}")
            return {
                "total_orders": 0,
                "total_revenue_cents": 0,
                "today_orders": 0,
                "today_revenue_cents": 0,
                "status_breakdown": {},
                "top_restaurants": []
            }