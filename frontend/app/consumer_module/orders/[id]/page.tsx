"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  MapPin,
  Package,
  Truck,
  User,
  Phone,
  ArrowLeft,
} from "lucide-react";

interface TrackingData {
  id: number;
  user_id?: number;
  status: string;
  delivery_address: string;
  total_cents: number;
  created_at: string;
  updated_at: string;
  restaurants?: { name: string; image?: string };
  items?: Array<{
    quantity: number;
    price_cents: number;
    menu_items?: { name: string };
  }>;
  rider?: {
    users?: { first_name: string; last_name: string; phone: string };
  };
  delivery?: { status: string };
}

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock, description: "Your order has been received" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, description: "Restaurant confirmed your order" },
  { key: "preparing", label: "Preparing", icon: ChefHat, description: "Your food is being prepared" },
  { key: "ready", label: "Ready", icon: Package, description: "Finding a delivery rider" },
  { key: "rider_assigned", label: "Rider Assigned", icon: User, description: "A rider is heading to the restaurant" },
  { key: "picked_up", label: "On the Way", icon: Truck, description: "Your order is on the way!" },
  { key: "delivered", label: "Delivered", icon: MapPin, description: "Enjoy your meal!" },
];

const API_BASE = "http://localhost:8000";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchTracking = async () => {
      try {
        const res = await fetch(`${API_BASE}/consumer/orders/${orderId}/track`);
        if (res.ok) {
          const data = await res.json();
          setTracking(data);
        }
      } catch (err) {
        console.error("Failed to fetch tracking:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!tracking?.id) return;
    const userId = tracking.user_id;
    if (!userId) return;

    const ws = new WebSocket(`ws://localhost:8000/consumer/ws/${userId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ORDER_STATUS_UPDATE" && data.order_id === tracking.id) {
          setTracking((prev) =>
            prev ? { ...prev, status: data.status, updated_at: data.timestamp ?? prev.updated_at } : prev
          );
        }
      } catch {}
    };

    ws.onerror = () => {};
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [tracking?.id, tracking?.user_id]);

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === tracking?.status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Order not found</p>
        <button onClick={() => router.back()} className="mt-4 text-red-500 underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 truncate">Order #{tracking.id}</h1>
            <p className="text-sm text-gray-500 truncate">
              {tracking.restaurants?.name || "Restaurant"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div
          className={`rounded-2xl p-6 text-white shadow-lg border-0 ${
            tracking.status === "delivered"
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : tracking.status === "cancelled"
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-orange-500 to-red-500"
          }`}
        >
          <div className="flex items-center gap-4">
            {currentStepIndex >= 0 && (
              <div className="p-3 bg-white/20 rounded-full shrink-0">
                {(() => {
                  const IconComponent = STATUS_STEPS[currentStepIndex]?.icon || Clock;
                  return <IconComponent className="w-8 h-8" />;
                })()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold">
                {STATUS_STEPS[currentStepIndex]?.label || tracking.status}
              </h2>
              <p className="text-white/90 mt-1 text-sm sm:text-base">
                {STATUS_STEPS[currentStepIndex]?.description || tracking.status}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-5 text-gray-900">Order Progress</h3>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const IconComponent = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isCurrent
                            ? "bg-orange-500 border-orange-500 text-white ring-4 ring-orange-200"
                            : "bg-gray-100 border-gray-200 text-gray-400"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    {index < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${isCompleted ? "bg-green-400" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                  <div className="pt-1 pb-5">
                    <p
                      className={`font-medium ${isCompleted ? "text-gray-900" : isCurrent ? "text-gray-700" : "text-gray-400"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {tracking.rider && (
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Your Rider</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {tracking.rider.users?.first_name?.[0] || "R"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {tracking.rider.users?.first_name} {tracking.rider.users?.last_name}
                </p>
                {tracking.rider.users?.phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Phone className="w-4 h-4" />
                    {tracking.rider.users.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Order Details</h3>
          <div className="space-y-2">
            {tracking.items?.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="bg-orange-100 text-orange-700 font-semibold w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">
                    {item.quantity}×
                  </span>
                  <span className="text-gray-800 truncate">{item.menu_items?.name || "Item"}</span>
                </div>
                <span className="font-medium text-gray-700 shrink-0 ml-2">
                  ${((item.price_cents ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">
              ${(tracking.total_cents / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Delivery Address</h3>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 leading-relaxed">{tracking.delivery_address || "Not specified"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
