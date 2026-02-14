"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
};


type AuthState = {
  isLoggedIn: boolean;
  user: User | null;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<User, "id" | "username">>) => void;
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
      localStorage.setItem("access_token", data.access_token);

      // Store email initially
      const next: AuthState = { isLoggedIn: true, user: { ...data, fullName: '', email: data.email, id: '', username: '' } };
      setState(next);
      persistState(next);

      // Fetch full profile after login
      const token = data.access_token;
      try {
        const res = await fetch(`http://localhost:8000/delivery/profile?email=${encodeURIComponent(data.email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const profileData = await res.json();
        setState(prev => {
        if (!prev.user) return prev;
        const next: AuthState = {
          ...prev,
          user: { ...prev.user, ...profileData, username: prev.user.username, id: prev.user.id },
        };
        persistState(next);
        return next;
      });
      // this merges the fetched profile into `user`
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    },

    logout: () => {
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
          user: { ...prev.user, ...updates, username: prev.user.username, id: prev.user.id },
        };
        persistState(next);
        return next;
      });
    },

  }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
