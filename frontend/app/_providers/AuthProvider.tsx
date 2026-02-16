"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Add this type at the top
export type Rider = {
  id: number;
  vehicle_type: string;
  license_plate: string;
  status: string; // available, unavailable, etc.
  city: string;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
};

export type User = {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  rider?: Rider;
  deliveries?: Array<{ delivery_fee_cents?: number }>; 
};



type AuthState = {
  isLoggedIn: boolean;
  user: User | null;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<User, "id" | "username">>) => void;
  refreshProfile: () => Promise<void>;
};

const STORAGE_KEY = "foodie.auth";
const TOKEN_KEY = "access_token";

const AuthContext = createContext<AuthContextValue | null>(null);

function loadState(): AuthState {
  if (typeof window === "undefined") return { isLoggedIn: false, user: null };

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { isLoggedIn: false, user: null };

  try {
    const parsed = JSON.parse(raw) as AuthState;
    return { isLoggedIn: parsed.isLoggedIn, user: parsed.user ?? null };
  } catch {
    return { isLoggedIn: false, user: null };
  }
}

function persistState(state: AuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ isLoggedIn: false, user: null });

  useEffect(() => {
    setState(loadState());
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,

    
    // After login in AuthProvider
    login: async (email: string, password: string) => {
      const response = await fetch("http://localhost:8000/delivery/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Invalid credentials");

      const data = await response.json();
      
      localStorage.setItem(TOKEN_KEY, data.access_token);

      // Store minimal user first
      const next: AuthState = {
        isLoggedIn: true,
        user: { ...data, fullName: '', email: data.email, id: '', username: '' },
      };
      setState(next);
      persistState(next);
      
      try {
        const res = await fetch(`http://localhost:8000/delivery/profile?email=${encodeURIComponent(data.email)}`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (!res.ok) return;

        const profileData = await res.json();
        console.log("profileData from backend:", profileData);

        // Merge the fetched profile into `user`
        setState(prev => {
          if (!prev.user) return prev;
          const merged: AuthState = {
            ...prev,
            user: { ...prev.user, ...profileData, id: prev.user.id, username: prev.user.username },
          };
          persistState(merged);
          return merged;
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    },

    logout: async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const currentUser = state.user;

      if (currentUser?.rider?.id && token) {
        try {
          await fetch("http://localhost:8000/delivery/status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              rider_id: currentUser.rider.id,
              status: "unavailable",
            }),
          });
        } catch (error) {
          console.error("Failed to update rider status on logout:", error);
        }
      }

      localStorage.removeItem(TOKEN_KEY);
      const next: AuthState = { isLoggedIn: false, user: null };
      setState(next);
      persistState(next);
    },

    updateProfile: (updates) => {
      setState(prev => {
        if (!prev.user) return prev;
        const next: AuthState = {
          ...prev,
          user: { ...prev.user, ...updates, username: prev.user.username, id: prev.user.id } as User,
        };
        persistState(next);
        return next;
      });
    },

    refreshProfile: async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const user = loadState().user;
      if (!token || !user?.email) return;

      try {
        const res = await fetch(`http://localhost:8000/delivery/profile?email=${encodeURIComponent(user.email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const profileData = await res.json();
        setState(prev => {
          if (!prev.user) return prev;
          const merged: AuthState = {
            ...prev,
            user: { ...prev.user, ...profileData, id: prev.user.id, username: prev.user.username },
          };
          persistState(merged);
          return merged;
        });
      } catch (err) {
        console.error("Failed to refresh profile:", err);
      }
    },

  }), [state]);

  // Refresh profile on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = loadState().user;
    if (token && user?.email) {
      const fetchProfile = async () => {
        try {
          const res = await fetch(`http://localhost:8000/delivery/profile?email=${encodeURIComponent(user.email)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const profileData = await res.json();
            setState(prev => {
              const next: AuthState = {
                isLoggedIn: true,
                user: { ...(prev.user || user), ...profileData },
              };
              persistState(next);
              return next;
            });
          }
        } catch (err) {
          console.error("Auth mount refresh error:", err);
        }
      };
      fetchProfile();
    }
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
