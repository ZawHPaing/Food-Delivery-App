from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from ..models.admin_order_models import (
    OrderResponse, OrderDetailResponse, OrdersListResponse,
    OrderStatsResponse, OrderStatusUpdate
)
from ..services.admin_order_service import AdminOrderService

router = APIRouter(prefix="/admin/orders", tags=["Admin - Orders"])


@router.get("/", response_model=OrdersListResponse)
async def list_orders(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    restaurant_id: Optional[int] = Query(None, description="Filter by restaurant ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    days: Optional[int] = Query(None, description="Filter orders from last N days"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)")
):
    """
    Get all orders with pagination and filters
    """
    try:
        # Parse dates if provided
        start_datetime = None
        end_datetime = None
        
        if days:
            end_datetime = datetime.now()
            start_datetime = end_datetime - timedelta(days=days)
        else:
            if start_date:
                try:
                    start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                except:
                    raise HTTPException(status_code=400, detail="Invalid start_date format")
            
            if end_date:
                try:
                    end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                except:
                    raise HTTPException(status_code=400, detail="Invalid end_date format")

        result = AdminOrderService.get_orders(
            page=page,
            per_page=per_page,
            status=status,
            restaurant_id=restaurant_id,
            user_id=user_id,
            start_date=start_datetime,
            end_date=end_datetime
        )

        return {
            "success": True,
            "orders": result["orders"],
            "total_count": result["total_count"],
            "page": result["page"],
            "per_page": result["per_page"]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching orders: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch orders"
        )


@router.get("/stats", response_model=OrderStatsResponse)
async def get_order_stats():
    """
    Get order statistics
    """
    try:
        stats = AdminOrderService.get_order_stats()
        return stats
    except Exception as e:
        print(f"Error fetching order stats: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch order statistics"
        )


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(order_id: int):
    """
    Get single order by ID
    """
    try:
        order = AdminOrderService.get_order_by_id(order_id)

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        return {
            "success": True,
            "order": order
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching order {order_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch order"
        )


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate
):
    """
    Update order status
    """
    try:
        updated_order = AdminOrderService.update_order_status(
            order_id,
            status_update.status
        )

        if not updated_order:
            # Check if order exists
            existing = AdminOrderService.get_order_by_id(order_id)
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid status transition"
                )
            else:
                raise HTTPException(
                    status_code=404,
                    detail="Order not found"
                )

        return {
            "success": True,
            "order": updated_order,
            "message": f"Order status updated to {status_update.status}"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating order {order_id} status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update order status"
        )


@router.delete("/{order_id}")
async def delete_order(order_id: int):
    """
    Delete an order
    """
    try:
        success = AdminOrderService.delete_order(order_id)

        if not success:
            # Check if order exists
            existing = AdminOrderService.get_order_by_id(order_id)
            if existing:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to delete order due to server error"
                )
            else:
                raise HTTPException(
                    status_code=404,
                    detail="Order not found"
                )

        return {
            "success": True,
            "message": "Order deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error deleting order {order_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while deleting order"
        )