"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import userDb from "@/data/userDb.json";

export type User = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
};

type AuthState = {
  isLoggedIn: boolean;
  user: User | null;
};

type AuthContextValue = AuthState & {
  loginMock: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<User, "id" | "username">>) => void;
};

const STORAGE_KEY = "foodie.auth";

const AuthContext = createContext<AuthContextValue | null>(null);

function getDefaultUser(): User {
  const first = userDb.users[0];
  return {
    id: first.id,
    username: "user",
    fullName: first.fullName ?? "user",
    email: first.email ?? "user@example.com",
    phone: first.phone ?? "",
    address: first.address ?? "",
  };
}

function loadState(): AuthState {
  if (typeof window === "undefined") {
    return { isLoggedIn: false, user: null };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { isLoggedIn: false, user: null };

  try {
    const parsed = JSON.parse(raw) as AuthState;
    if (typeof parsed?.isLoggedIn !== "boolean") return { isLoggedIn: false, user: null };
    return {
      isLoggedIn: parsed.isLoggedIn,
      user: parsed.user ?? null,
    };
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

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,
      loginMock: () => {
        const next: AuthState = { isLoggedIn: true, user: getDefaultUser() };
        setState(next);
        persistState(next);
      },
      logout: () => {
        const next: AuthState = { isLoggedIn: false, user: null };
        setState(next);
        persistState(next);
      },
      updateProfile: (updates) => {
        setState((prev) => {
          if (!prev.user) return prev;
          const next: AuthState = {
            ...prev,
            user: {
              ...prev.user,
              ...updates,
              username: prev.user.username,
              id: prev.user.id,
            },
          };
          persistState(next);
          return next;
        });
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
