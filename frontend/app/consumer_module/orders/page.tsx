"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCustomerAuth } from "@/app/_providers/CustomerAuthProvider";
import { listOrders, type OrderRecord } from "@/lib/customerApi";
import { formatPrice } from "@/types";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  picked_up: "bg-purple-100 text-purple-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const { isLoggedIn } = useCustomerAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    listOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">Sign in to view your orders.</p>
            <Link
              href="/login?redirect=/consumer_module/orders"
              className="inline-block mt-6 bg-[#e4002b] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#c40026]"
            >
              Sign in
            </Link>
            <Link href="/consumer_module" className="inline-block mt-4 ml-4 text-[#e4002b] font-semibold hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <Link
            href="/consumer_module"
            className="text-[#e4002b] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#e4002b]/30 rounded"
          >
            Back to home
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-[#e4002b]/30 border-t-[#e4002b] rounded-full animate-spin" />
            <p className="text-gray-500 mt-4">Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">When you place an order, it will show up here.</p>
            <Link
              href="/consumer_module/restaurants"
              className="inline-block bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg"
            >
              Browse restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/consumer_module/orders/${order.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200"
              >
                <div className="flex justify-between items-start gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {order.restaurant_name ?? `Order #${order.id}`}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColor[order.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#e4002b] text-lg">{formatPrice(order.total_cents)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.items?.length ?? 0} items</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
