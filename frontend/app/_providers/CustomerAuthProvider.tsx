"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
// Same base as delivery login/register (AuthProvider, SignupOverlay): hardcoded so auth works without env
const AUTH_API_BASE = "http://localhost:8000";

export type CustomerUser = {
  user_id: number;
  email: string;
  user_type: string;
  first_name?: string;
  last_name?: string;
};

type CustomerAuthState = {
  isLoggedIn: boolean;
  user: CustomerUser | null;
  token: string | null;
};

type CustomerAuthContextValue = CustomerAuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    user_type?: string;
  }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "foodie.customer.auth";
const TOKEN_KEY = "foodie.customer.token";

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

function loadState(): CustomerAuthState {
  if (typeof window === "undefined")
    return { isLoggedIn: false, user: null, token: null };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!raw || !token) return { isLoggedIn: false, user: null, token: null };
  try {
    const parsed = JSON.parse(raw) as { user: CustomerUser };
    return { isLoggedIn: true, user: parsed.user ?? null, token };
  } catch {
    return { isLoggedIn: false, user: null, token: null };
  }
}

function persistState(user: CustomerUser | null, token: string | null) {
  if (typeof window === "undefined") return;
  if (user && token) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CustomerAuthState>({
    isLoggedIn: false,
    user: null,
    token: null,
  });

  useEffect(() => {
    setState(loadState());
  }, []);

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      ...state,
      login: async (email: string, password: string) => {
  const res = await fetch(`${AUTH_API_BASE}/auth/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (typeof data.detail === "string"
        ? data.detail
        : (data.detail as { message?: string })?.message) ||
        "Invalid email or password"
    );
  
  const token = data.access_token;
  
  // Include full user data from response
  const user: CustomerUser = {
    user_id: data.user_id,
    email: data.email,
    user_type: data.user_type || "customer",
  };
  
  console.log("Login response data:", data); // Debug log
  console.log("User type from login:", user.user_type); // Debug log
  
  setState({ isLoggedIn: true, user, token });
  persistState(user, token);
},
      register: async (data) => {
        let res: Response;
        try {
          res = await fetch(`${AUTH_API_BASE}/auth/user/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              phone: data.phone,
              password: data.password,
              user_type: data.user_type || "customer",
            }),
          });
        } catch (err) {
          throw new Error(
            err instanceof Error ? err.message : "Cannot reach server. Is the backend running?"
          );
        }
        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = result.detail;
          const msg =
            typeof detail === "string"
              ? detail
              : Array.isArray(detail) && detail[0]?.msg
                ? String(detail[0].msg)
                : detail?.message
                  ? String(detail.message)
                  : "Registration failed";
          throw new Error(msg);
        }
        const token = result.access_token;
        const u = result.user;
        if (!token || !u) {
          throw new Error("Invalid response from server");
        }
        const user: CustomerUser = {
          user_id: u.id ?? result.user_id,
          email: u.email ?? data.email,
          user_type: u.user_type ?? "customer",
          first_name: u.first_name ?? data.first_name,
          last_name: u.last_name ?? data.last_name,
        };
        
        console.log("Registration response user type:", user.user_type); // Debug log
        
        setState({ isLoggedIn: true, user, token });
        persistState(user, token);
      },
      logout: () => {
        setState({ isLoggedIn: false, user: null, token: null });
        persistState(null, null);
      },
    }),
    [state]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx)
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}