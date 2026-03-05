"use client";

import React from "react";
import { AuthProvider } from "./AuthProvider";
import { CustomerAuthProvider } from "./CustomerAuthProvider";
import { DeliveryProvider } from "./DeliveryProvider";
import { CartProvider } from "./CartProvider";
import { FavoritesProvider } from "./FavoritesProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <DeliveryProvider>
          <CartProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </CartProvider>
        </DeliveryProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  );
}
