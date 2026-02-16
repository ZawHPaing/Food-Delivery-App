"use client";

import React from "react";
import { AuthProvider } from "./AuthProvider";
import { CustomerAuthProvider } from "./CustomerAuthProvider";
import { CartProvider } from "./CartProvider";
import { FavoritesProvider } from "./FavoritesProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </CartProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}
