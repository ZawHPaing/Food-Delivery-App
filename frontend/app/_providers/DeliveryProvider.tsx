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
  currentLocation?: { latitude: number; longitude: number } | null;
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
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasDBLocation, setHasDBLocation] = useState(false);

  const { user, updateProfile } = useAuth();
  const userId = user?.id;
  const storageUserId =
    (user as { id?: string | number })?.id ??
    (user as { rider?: { user_id?: number } })?.rider?.user_id;
  const websocketUserId =
    Number((user as { id?: string | number })?.id) ||
    (user as { rider?: { user_id?: number } })?.rider?.user_id ||
    0;
  const socketRef = useRef<WebSocket | null>(null);
  const isInitialized = useRef(false);

  console.log("[DeliveryProvider] Initializing with user:", user);
  console.log("[DeliveryProvider] websocketUserId:", websocketUserId);
  console.log("[DeliveryProvider] riderId:", (user as { rider?: { id?: number } })?.rider?.id);

  useEffect(() => {
    setIsClient(true);
    const keyId = storageUserId != null ? String(storageUserId) : null;

    const savedStatus = keyId
      ? (localStorage.getItem(`driver_status_${keyId}`) as DriverStatus | null)
      : null;
    const savedVehicle = keyId
      ? (localStorage.getItem(`driver_vehicle_${keyId}`) as VehicleType | null)
      : null;
    const savedShift = keyId ? localStorage.getItem(`driver_shift_start_${keyId}`) : null;
    const savedOrder = keyId ? localStorage.getItem(`driver_active_order_${keyId}`) : null;
    const savedIncoming = keyId ? localStorage.getItem(`driver_incoming_requests_${keyId}`) : null;

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
    if (savedIncoming) {
      try {
        const parsed: DeliveryRequest[] = JSON.parse(savedIncoming);
        const now = Date.now();
        const restored = parsed
          .map((r) => ({
            ...r,
            expiresAt: r.expiresAt ? new Date(r.expiresAt as unknown as string) : new Date(now + 60000),
          }))
          .filter((r) => (r.expiresAt ? r.expiresAt.getTime() > now : true));
        setIncomingRequests(restored);
      } catch {
        // ignore
      }
    }

    isInitialized.current = true;
  }, [storageUserId, user?.rider?.status]);

  useEffect(() => {
    if (!isClient || !isInitialized.current) return;
    const keyId = storageUserId != null ? String(storageUserId) : null;
    if (!keyId) return;

    localStorage.setItem(`driver_status_${keyId}`, status);
    localStorage.setItem(`driver_vehicle_${keyId}`, vehicle);
    if (shiftStartTime) {
      localStorage.setItem(`driver_shift_start_${keyId}`, shiftStartTime.toISOString());
    } else {
      localStorage.removeItem(`driver_shift_start_${keyId}`);
    }

    if (activeOrder) {
      localStorage.setItem(`driver_active_order_${keyId}`, JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem(`driver_active_order_${keyId}`);
    }
    console.log("[DeliveryProvider] State saved:", { status, vehicle, shiftStartTime, activeOrder });
  }, [status, vehicle, shiftStartTime, activeOrder, isClient, storageUserId]);

  useEffect(() => {
    if (!isClient || !isInitialized.current) return;
    const keyId = storageUserId != null ? String(storageUserId) : null;
    if (!keyId) return;
    const now = Date.now();
    const pruned = incomingRequests.filter((r) => (r.expiresAt ? new Date(r.expiresAt as unknown as string).getTime() > now : true));
    localStorage.setItem(`driver_incoming_requests_${keyId}`, JSON.stringify(pruned));
  }, [incomingRequests, isClient, storageUserId]);

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
        setCurrentLocation({ latitude, longitude });
      } catch {
      }
    };

    const FALLBACK_LAT = 16.8661;
    const FALLBACK_LNG = 96.1951;

    const fetchDBLocation = async () => {
      const riderId = (user as { rider?: { id?: number } })?.rider?.id;
      if (!riderId) return false;
      try {
        const res = await fetch(`http://localhost:8000/delivery/location?rider_id=${riderId}`);
        if (!res.ok) return false;
        const data = await res.json();
        if (typeof data.latitude === "number" && typeof data.longitude === "number") {
          setCurrentLocation({ latitude: data.latitude, longitude: data.longitude });
          setHasDBLocation(true);
          return true;
        }
      } catch {
      }
      return false;
    };

    const updateLocation = async () => {
      const has = await fetchDBLocation();
      if (has) return;
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
    let interval: any = null;
    if (!hasDBLocation) {
      interval = setInterval(updateLocation, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClient, websocketUserId, status, user, hasDBLocation]);

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
      let data: any;
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
            name: String(data.restaurant_name ?? ""),
            address: "Restaurant Address",
            distance: Number(data.distance ?? 0),
            latitude: Number(data.restaurant_latitude) || undefined,
            longitude: Number(data.restaurant_longitude) || undefined,
          },
          items: Array.isArray(data.items) ? data.items.map((item: { name?: string; quantity?: number }, idx: number) => ({
            id: `item-${idx}`,
            name: item.name ?? "Item",
            quantity: item.quantity ?? 0,
          })) : [],
          customer: {
            id: "c1",
            name: String(data.customer_name || "Customer"),
            address: String(data.delivery_address || ""),
            latitude: Number(data.delivery_latitude) || undefined,
            longitude: Number(data.delivery_longitude) || undefined,
            phone: String(data.customer_phone || ""),
          },
          deliveryDistance: Number(data.distance_to_customer) || Number(data.distance) || 0,
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
        if (requests.length === 0) {
          console.log("[DeliveryProvider] Polling: No new requests.");
          return;
        }
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
                  latitude: Number(d.restaurant_latitude) || undefined,
                  longitude: Number(d.restaurant_longitude) || undefined,
                },
                items: (d.items || []).map((item: { name?: string; quantity?: number }, idx: number) => ({
                  id: `item-${idx}`,
                  name: item.name ?? "Item",
                  quantity: item.quantity ?? 0,
                })),
                customer: {
                  id: "c1",
                  name: String(d.customer_name || "Customer"),
                  address: String(d.delivery_address || ""),
                  latitude: Number(d.delivery_latitude) || undefined,
                  longitude: Number(d.delivery_longitude) || undefined,
                  phone: String(d.customer_phone || ""),
                },
                deliveryDistance: Number(d.distance_to_customer) || Number(d.distance) || 0,
                estimatedPickupTime: 5,
                estimatedDeliveryTime: 15,
                expiresAt: new Date(d.expires_at ?? Date.now() + 60000),
              });
            }
          }
          const updatedRequests = Array.from(byRequestId.values());
          console.log("[DeliveryProvider] Polling: Incoming requests updated.", updatedRequests);
          return updatedRequests;
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
    if (!riderId) return;

    const FALLBACK_LAT = 16.8661;
    const FALLBACK_LNG = 96.1951;

    const postLocation = async (latitude: number, longitude: number) => {
      try {
        await fetch("http://localhost:8000/delivery/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rider_id: riderId, latitude, longitude }),
        });
        setCurrentLocation({ latitude, longitude });
      } catch {
      }
    };

    try {
      const res = await fetch(`http://localhost:8000/delivery/location?rider_id=${riderId}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.latitude === "number" && typeof data.longitude === "number") {
          setCurrentLocation({ latitude: data.latitude, longitude: data.longitude });
          setHasDBLocation(true);
          return;
        }
      }
    } catch {
    }

    if (!("geolocation" in navigator)) {
      await postLocation(FALLBACK_LAT, FALLBACK_LNG);
      return;
    }

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
    console.log("[DeliveryProvider] Toggled online status to:", nextStatus);
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
        console.log("[DeliveryProvider] Accept Order Response Status:", res.status);
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setActiveOrder({
            id: request.id,
            deliveryId: data.delivery_id ? parseInt(data.delivery_id) : undefined,
            phase: "pickup",
            shop: {
              ...request.shop,
              latitude: request.shop.latitude,
              longitude: request.shop.longitude,
            },
            items: request.items,
            customer: request.customer,
            isWithinPickupRange: false,
          });
          setStatus("busy");
          setIncomingRequests([]);
        } else {
          console.error("[DeliveryProvider] Accept Order Error:", res.status, data);
        }
      } catch (err) {
        console.error("[DeliveryProvider] Accept Order Exception:", err);
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

  const pickupOrder = useCallback(async () => {
    if (activeOrder && activeOrder.deliveryId) {
      const riderId = (user as { rider?: { id?: number } })?.rider?.id;
      if (!riderId) return;

      try {
        const res = await fetch(
          `http://localhost:8000/delivery/deliveries/${activeOrder.deliveryId}/pickup?rider_id=${riderId}`,
          { method: "POST" }
        );
        if (res.ok) {
          setActiveOrder({
            ...activeOrder,
            phase: "dropoff",
            pickedUpAt: new Date(),
          });
        }
      } catch (err) {
        console.error("[DeliveryProvider] Pickup Error:", err);
      }
    } else if (activeOrder) {
      // Fallback for local-only if deliveryId is missing
      setActiveOrder({
        ...activeOrder,
        phase: "dropoff",
        pickedUpAt: new Date(),
      });
    }
  }, [activeOrder, user]);

  const completeOrder = useCallback(async () => {
    if (activeOrder && activeOrder.deliveryId) {
      const riderId = (user as { rider?: { id?: number } })?.rider?.id;
      if (!riderId) return;

      try {
        const res = await fetch(
          `http://localhost:8000/delivery/deliveries/${activeOrder.deliveryId}/deliver?rider_id=${riderId}`,
          { method: "POST" }
        );
        if (res.ok) {
          setActiveOrder(null);
          setMessages([]);
          setStatus("online");
        }
      } catch (err) {
        console.error("[DeliveryProvider] Complete Error:", err);
      }
    } else {
      setActiveOrder(null);
      setMessages([]);
      setStatus("online");
    }
  }, [activeOrder, user]);

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
      currentLocation,
      setStatus,
      setVehicle: async (newVehicle: VehicleType) => {
        const rider = (user as any)?.rider;
        const riderId = rider?.id;
        if (riderId) {
          try {
            await fetch("http://localhost:8000/delivery/vehicle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rider_id: riderId, vehicle: newVehicle }),
            });
            
            // Update auth profile state to sync across UI components
            if (updateProfile && rider) {
              updateProfile({
                rider: {
                  ...rider,
                  vehicle_type: newVehicle
                }
              } as any);
            }
          } catch (err) {
            console.error("[DeliveryProvider] Failed to update vehicle on backend:", err);
          }
        }
        setVehicle(newVehicle);
      },
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
      currentLocation,
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
