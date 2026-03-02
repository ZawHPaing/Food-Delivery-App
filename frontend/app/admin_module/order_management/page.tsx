"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  quantity: number;
  price_cents: number;
  special_instructions: string | null;
  item_name: string | null;
};

type Order = {
  id: number;
  user_id: number;
  restaurant_id: number | null;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  restaurant_name: string | null;
  items: OrderItem[];
};

type OrderStats = {
  total_orders: number;
  total_revenue_cents: number;
  today_orders: number;
  today_revenue_cents: number;
  status_breakdown: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    rider_assigned: number;
    picked_up: number;
    delivered: number;
    cancelled: number;
  };
  top_restaurants: any[];
};

type PaginatedResponse = {
  success: boolean;
  orders: Order[];
  total_count: number;
  page: number;
  per_page: number;
};

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [restaurants, setRestaurants] = useState<{ id: number; name: string }[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, restaurantFilter, dateFilter, currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/admin/orders/?page=${currentPage}&per_page=${perPage}`;
      
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      if (restaurantFilter) {
        url += `&restaurant_id=${restaurantFilter}`;
      }
      
      if (dateFilter === "today") {
        url += `&days=1`;
      } else if (dateFilter === "week") {
        url += `&days=7`;
      } else if (dateFilter === "month") {
        url += `&days=30`;
      }

      const res = await fetch(url);
      const data: PaginatedResponse = await res.json();
      
      if (res.ok && data.success) {
        setOrders(data.orders);
        setTotalPages(Math.ceil(data.total_count / perPage));
      } else {
        console.error("Failed to fetch orders:", data);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/restaurants/`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setRestaurants(data.restaurants || []);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Update the order in the list
        setOrders(orders.map(order => 
          order.id === orderId ? data.order : order
        ));
        
        // Update selected order if modal is open
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.detail || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Network error while updating order status");
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Remove from list
        setOrders(orders.filter(order => order.id !== orderId));
        
        // Close modal if open
        if (selectedOrder && selectedOrder.id === orderId) {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }
      } else {
        alert(data.detail || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Network error while deleting order");
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'confirmed':
        return 'bg-info/10 text-info';
      case 'preparing':
        return 'bg-primary/10 text-primary';
      case 'ready':
        return 'bg-success/10 text-success';
      case 'rider_assigned':
        return 'bg-purple-100 text-purple-700';
      case 'picked_up':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-success/20 text-success';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'rider_assigned': return 'Rider Assigned';
      case 'picked_up': return 'Picked Up';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const nextStatusOptions = (currentStatus: string): string[] => {
    switch(currentStatus) {
      case 'pending': return ['confirmed', 'cancelled'];
      case 'confirmed': return ['preparing', 'cancelled'];
      case 'preparing': return ['ready', 'cancelled'];
      case 'ready': return ['rider_assigned'];
      case 'rider_assigned': return ['picked_up'];
      case 'picked_up': return ['delivered'];
      default: return [];
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold gradient-primary text-transparent bg-clip-text">
          Order Management
        </h1>
        <div className="glass px-4 py-2 rounded-xl text-sm">
          Total Orders: <span className="font-bold text-primary">{orders.length}</span>
        </div>
      </div>

      {/* Status Breakdown - Kept as it provides useful filtering context */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="font-semibold mb-4">Quick Filters by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status === statusFilter ? '' : status)}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                statusFilter === status 
                  ? 'gradient-primary text-primary-foreground shadow-glow' 
                  : 'bg-white/50 hover:bg-white'
              }`}
            >
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                statusFilter === status 
                  ? 'text-white' 
                  : getStatusBadgeClass(status)
              }`}>
                {getStatusLabel(status)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 glass-card p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Status</label>
            <select
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="rider_assigned">Rider Assigned</option>
              <option value="picked_up">Picked Up</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Restaurant</label>
            <select
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={restaurantFilter}
              onChange={(e) => {
                setRestaurantFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Restaurants</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Date Range</label>
            <select
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter("");
                setRestaurantFilter("");
                setDateFilter("all");
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 border border-border rounded-xl hover:bg-muted transition-colors w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-border/30">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Restaurant</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {order.customer_name || `User #${order.user_id}`}
                        <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {order.restaurant_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                        {formatPrice(order.total_cents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-primary hover:text-primary/80 px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors"
                        >
                          View
                        </button>
                        <select
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          value=""
                          className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="" disabled>Update Status</option>
                          {nextStatusOptions(order.status).map(status => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <option value="cancelled" className="text-destructive">Cancel Order</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal - Now white instead of glass */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border pb-4 mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold gradient-primary text-transparent bg-clip-text">
                Order #{selectedOrder.id}
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              {/* Customer Info */}
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> {selectedOrder.customer_name || 'N/A'}</div>
                  <div><span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email || 'N/A'}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone || 'N/A'}</div>
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-2">Restaurant</h3>
                <p className="text-sm">{selectedOrder.restaurant_name || 'Unknown'}</p>
              </div>

              {/* Delivery Address */}
              {selectedOrder.delivery_address && (
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-2">Delivery Address</h3>
                  <p className="text-sm">{selectedOrder.delivery_address}</p>
                </div>
              )}

              {/* Order Items */}
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded-lg">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.item_name || `Item #${item.menu_item_id}`}
                        {item.special_instructions && (
                          <div className="text-xs text-muted-foreground mt-1">Note: {item.special_instructions}</div>
                        )}
                      </div>
                      <span className="font-medium">{formatPrice(item.price_cents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-border pt-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal_cents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>{formatPrice(selectedOrder.tax_cents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee:</span>
                    <span>{formatPrice(selectedOrder.delivery_fee_cents)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(selectedOrder.total_cents)}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t border-border pt-4 text-xs text-muted-foreground">
                <div>Created: {formatDateTime(selectedOrder.created_at)}</div>
                <div>Last Updated: {formatDateTime(selectedOrder.updated_at)}</div>
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 flex justify-end space-x-3">
                <select
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  value=""
                  className="border border-border rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="" disabled>Update Status</option>
                  {nextStatusOptions(selectedOrder.status).map(status => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <option value="cancelled" className="text-destructive">Cancel Order</option>
                  )}
                </select>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this order?")) {
                      deleteOrder(selectedOrder.id);
                    }
                  }}
                  className="px-4 py-2 border border-destructive text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}