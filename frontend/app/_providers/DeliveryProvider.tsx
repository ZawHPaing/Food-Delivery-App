"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  DriverStatus,
  VehicleType,
  DeliveryRequest,
  ActiveOrder,
  Message,
} from "@/types/delivery";
import { useAuth } from "@/app/_providers/AuthProvider";

interface DeliveryContextValue {
  status: DriverStatus;
  vehicle: VehicleType;
  shiftStartTime: Date | null;
  incomingRequests: DeliveryRequest[];
  activeOrder: ActiveOrder | null;
  messages: Message[];
  setStatus: (status: DriverStatus) => void;
  setVehicle: (vehicle: VehicleType) => void;
  toggleOnline: () => void;
  acceptOrder: (request: DeliveryRequest) => Promise<void>;
  declineOrder: (requestId: string) => Promise<void>;
  arrivedAtShop: () => void;
  pickupOrder: () => void;
  completeOrder: () => void;
  sendMessage: (content: string) => void;
}

const DeliveryContext = createContext<DeliveryContextValue | null>(null);

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState<DriverStatus>("offline");
  const [vehicle, setVehicle] = useState<VehicleType>("bike");
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<DeliveryRequest[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const { user } = useAuth();
  const userId = user?.id;
  const websocketUserId =
    Number((user as { id?: string | number })?.id) ||
    (user as { rider?: { user_id?: number } })?.rider?.user_id ||
    0;
  const socketRef = useRef<WebSocket | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    setIsClient(true);
    if (!userId) return;

    const savedStatus = localStorage.getItem(`driver_status_${userId}`) as DriverStatus | null;
    const savedVehicle = localStorage.getItem(`driver_vehicle_${userId}`) as VehicleType | null;
    const savedShift = localStorage.getItem(`driver_shift_start_${userId}`);
    const savedOrder = localStorage.getItem(`driver_active_order_${userId}`);

    if (savedStatus) {
      setStatus(savedStatus);
    } else if (user?.rider?.status) {
      const backendStatus =
        user.rider.status === "available"
          ? "online"
          : user.rider.status === "busy"
            ? "busy"
            : "offline";
      setStatus(backendStatus);
    }

    if (savedVehicle) setVehicle(savedVehicle);
    if (savedShift) setShiftStartTime(new Date(savedShift));

    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (parsed.arrivedAtShopAt) parsed.arrivedAtShopAt = new Date(parsed.arrivedAtShopAt);
        if (parsed.pickedUpAt) parsed.pickedUpAt = new Date(parsed.pickedUpAt);
        setActiveOrder(parsed);
      } catch {
        // ignore
      }
    }

    isInitialized.current = true;
  }, [userId, user?.rider?.status]);

  useEffect(() => {
    if (!isClient || !userId || !isInitialized.current) return;

    localStorage.setItem(`driver_status_${userId}`, status);
    localStorage.setItem(`driver_vehicle_${userId}`, vehicle);
    if (shiftStartTime) {
      localStorage.setItem(`driver_shift_start_${userId}`, shiftStartTime.toISOString());
    } else {
      localStorage.removeItem(`driver_shift_start_${userId}`);
    }

    if (activeOrder) {
      localStorage.setItem(`driver_active_order_${userId}`, JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem(`driver_active_order_${userId}`);
    }
  }, [status, vehicle, shiftStartTime, activeOrder, isClient, userId]);

  useEffect(() => {
    if (!isClient || !websocketUserId || (status !== "online" && status !== "busy")) return;

    const sendLocation = async (latitude: number, longitude: number) => {
      const riderId = (user as { rider?: { id?: number } })?.rider?.id;
      if (!riderId) return;
      try {
        await fetch("http://localhost:8000/delivery/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rider_id: riderId, latitude, longitude }),
        });
      } catch {
        // ignore
      }
    };

    const FALLBACK_LAT = 16.8661;
    const FALLBACK_LNG = 96.1951;

    const updateLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => sendLocation(position.coords.latitude, position.coords.longitude),
          () => sendLocation(FALLBACK_LAT, FALLBACK_LNG),
          { timeout: 5000 }
        );
      } else {
        sendLocation(FALLBACK_LAT, FALLBACK_LNG);
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 30000);
    return () => clearInterval(interval);
  }, [isClient, websocketUserId, status, user]);

  useEffect(() => {
    if (status !== "online" || !websocketUserId) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const wsUrl = `ws://localhost:8000/delivery/ws/${websocketUserId}`;
    console.log("[Delivery] Connecting WebSocket as user_id:", websocketUserId, "url:", wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[Delivery] WebSocket connected (user_id:", websocketUserId, ")");
    };
    socket.onerror = (err) => {
      console.warn("[Delivery] WebSocket error:", err);
    };
    socket.onclose = (ev) => {
      console.log("[Delivery] WebSocket closed code:", ev.code, "reason:", ev.reason);
    };

    socket.onmessage = (event) => {
      let data: { type?: string; order_id?: number; request_id?: number; [k: string]: unknown };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      console.log("[Delivery] WebSocket message:", data.type || "unknown", data.order_id != null ? "order_id=" + data.order_id : "");
      if (data.type === "NEW_ORDER_REQUEST") {
        const newRequest: DeliveryRequest = {
          id: String(data.order_id),
          requestId: String(data.request_id),
          shop: {
            id: String(data.order_id),
            name: data.restaurant_name,
            address: "Restaurant Address",
            distance: data.distance,
          },
          items: (data.items || []).map((item: { name?: string; quantity?: number }, idx: number) => ({
            id: `item-${idx}`,
            name: item.name ?? "Item",
            quantity: item.quantity ?? 0,
          })),
          customer: {
            id: "c1",
            name: data.customer_name ?? "",
            address: data.delivery_address ?? "",
          },
          deliveryDistance: data.distance_to_customer ?? data.distance ?? 0,
          estimatedPickupTime: 5,
          estimatedDeliveryTime: 15,
          expiresAt: new Date(data.expires_at ?? Date.now() + 60000),
        };
        setIncomingRequests((prev) => [...prev, newRequest]);
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [status, websocketUserId]);

  const riderId = (user as { rider?: { id?: number } })?.rider?.id;
  useEffect(() => {
    if (status !== "online" || !riderId || !isClient) return;
    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:8000/delivery/requests?rider_id=${riderId}`);
        if (!res.ok) return;
        const data = await res.json();
        const requests = data.requests || [];
        if (requests.length === 0) return;
        setIncomingRequests((prev) => {
          const byRequestId = new Map(prev.map((r) => [r.requestId, r]));
          for (const d of requests) {
            if (d.type === "NEW_ORDER_REQUEST" && d.request_id) {
              const key = String(d.request_id);
              if (byRequestId.has(key)) continue;
              byRequestId.set(key, {
                id: String(d.order_id),
                requestId: String(d.request_id),
                shop: {
                  id: String(d.order_id),
                  name: d.restaurant_name ?? "",
                  address: "Restaurant Address",
                  distance: d.distance ?? 0,
                },
                items: (d.items || []).map((item: { name?: string; quantity?: number }, idx: number) => ({
                  id: `item-${idx}`,
                  name: item.name ?? "Item",
                  quantity: item.quantity ?? 0,
                })),
                customer: {
                  id: "c1",
                  name: d.customer_name ?? "",
                  address: d.delivery_address ?? "",
                },
                deliveryDistance: d.distance_to_customer ?? d.distance ?? 0,
                estimatedPickupTime: 5,
                estimatedDeliveryTime: 15,
                expiresAt: new Date(d.expires_at ?? Date.now() + 60000),
              });
            }
          }
          return Array.from(byRequestId.values());
        });
      } catch {
        // ignore
      }
    };
    const t = setTimeout(poll, 500);
    const interval = setInterval(poll, 4000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [status, riderId, isClient]);

  const updateBackendStatus = async (newStatus: DriverStatus) => {
    const riderId = (user as { rider?: { id?: number } })?.rider?.id;
    if (!riderId) return;

    const backendStatus =
      newStatus === "online" ? "available" : newStatus === "busy" ? "busy" : "unavailable";

    try {
      const token = localStorage.getItem("access_token");
      await fetch("http://localhost:8000/delivery/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rider_id: riderId, status: backendStatus }),
      });
    } catch {
      // ignore
    }
  };

  const requestAndSendCurrentLocation = async () => {
    const riderId = (user as { rider?: { id?: number } })?.rider?.id;
    if (!riderId || !("geolocation" in navigator)) return;

    const FALLBACK_LAT = 16.8661;
    const FALLBACK_LNG = 96.1951;

    const postLocation = async (latitude: number, longitude: number) => {
      try {
        await fetch("http://localhost:8000/delivery/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rider_id: riderId, latitude, longitude }),
        });
      } catch {
        // ignore
      }
    };

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await postLocation(position.coords.latitude, position.coords.longitude);
          resolve();
        },
        async () => {
          await postLocation(FALLBACK_LAT, FALLBACK_LNG);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    });
  };

  const toggleOnline = useCallback(async () => {
    const nextStatus = status === "offline" ? "online" : "offline";

    if (nextStatus === "online") {
      await requestAndSendCurrentLocation();
    }

    setStatus(nextStatus);

    if (nextStatus === "online") {
      setShiftStartTime(new Date());
    } else {
      setShiftStartTime(null);
      setActiveOrder(null);
    }

    await updateBackendStatus(nextStatus);
  }, [status, user]);

  const acceptOrder = useCallback(
    async (request: DeliveryRequest) => {
      try {
        const riderId = (user as { rider?: { id?: number } })?.rider?.id;
        if (!riderId) return;

        const res = await fetch(
          `http://localhost:8000/delivery/requests/${request.requestId}/respond?action=accept&rider_id=${riderId}`,
          { method: "POST" }
        );

        if (res.ok) {
          setActiveOrder({
            id: request.id,
            phase: "pickup",
            shop: request.shop,
            items: request.items,
            customer: request.customer,
            isWithinPickupRange: false,
          });
          setStatus("busy");
          setIncomingRequests([]);
        }
      } catch {
        // ignore
      }
    },
    [user]
  );

  const declineOrder = useCallback(
    async (requestId: string) => {
      const request = incomingRequests.find((r) => r.id === requestId);
      if (!request) return;

      try {
        const riderId = (user as { rider?: { id?: number } })?.rider?.id;
        if (riderId) {
          await fetch(
            `http://localhost:8000/delivery/requests/${request.requestId}/respond?action=reject&rider_id=${riderId}`,
            { method: "POST" }
          );
        }
        setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      } catch {
        // ignore
      }
    },
    [user, incomingRequests]
  );

  const arrivedAtShop = useCallback(() => {
    if (activeOrder) {
      setActiveOrder({
        ...activeOrder,
        arrivedAtShopAt: new Date(),
        isWithinPickupRange: true,
      });
    }
  }, [activeOrder]);

  const pickupOrder = useCallback(() => {
    if (activeOrder) {
      setActiveOrder({
        ...activeOrder,
        phase: "dropoff",
        pickedUpAt: new Date(),
      });
    }
  }, [activeOrder]);

  const completeOrder = useCallback(() => {
    setActiveOrder(null);
    setMessages([]);
    setStatus("online");
  }, []);

  const sendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "driver",
      content,
      timestamp: new Date(),
      isDriver: true,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    if (
      activeOrder?.phase === "pickup" &&
      activeOrder.arrivedAtShopAt &&
      !activeOrder.isWithinPickupRange
    ) {
      const timer = setTimeout(() => {
        setActiveOrder((prev) => (prev ? { ...prev, isWithinPickupRange: true } : null));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeOrder]);

  const value = useMemo(
    () => ({
      status,
      vehicle,
      shiftStartTime,
      incomingRequests,
      activeOrder,
      messages,
      setStatus,
      setVehicle,
      toggleOnline,
      acceptOrder,
      declineOrder,
      arrivedAtShop,
      pickupOrder,
      completeOrder,
      sendMessage,
    }),
    [
      status,
      vehicle,
      shiftStartTime,
      incomingRequests,
      activeOrder,
      messages,
      toggleOnline,
      acceptOrder,
      declineOrder,
      arrivedAtShop,
      pickupOrder,
      completeOrder,
      sendMessage,
    ]
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDeliveryContext() {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error("useDeliveryContext must be used within DeliveryProvider");
  }
  return context;
}
