"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { MenuItem, Restaurant } from "@/types";

interface FavoriteItem {
  menuItem: MenuItem;
  restaurant: Pick<Restaurant, "id" | "name" | "image">;
}

interface FavoritesContextValue {
  items: FavoriteItem[];
  addFavorite: (menuItem: MenuItem, restaurant: Pick<Restaurant, "id" | "name" | "image">) => void;
  removeFavorite: (menuItemId: number) => void;
  toggleFavorite: (menuItem: MenuItem, restaurant: Pick<Restaurant, "id" | "name" | "image">) => void;
  isFavorite: (menuItemId: number) => boolean;
  clearFavorites: () => void;
  isFavoritesOpen: boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
  toggleFavorites: () => void;
}

const STORAGE_KEY = "foodie.favorites";

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.items)) {
        return parsed.items as FavoriteItem[];
      }
      return [];
    } catch {
      return [];
    }
  });
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  }, [items]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      items,
      addFavorite: (menuItem, restaurant) => {
        setItems((prev) => {
          if (prev.some((fav) => fav.menuItem.id === menuItem.id)) {
            return prev;
          }
          return [...prev, { menuItem, restaurant }];
        });
      },
      removeFavorite: (menuItemId) => {
        setItems((prev) => prev.filter((fav) => fav.menuItem.id !== menuItemId));
      },
      toggleFavorite: (menuItem, restaurant) => {
        setItems((prev) => {
          if (prev.some((fav) => fav.menuItem.id === menuItem.id)) {
            return prev.filter((fav) => fav.menuItem.id !== menuItem.id);
          }
          return [...prev, { menuItem, restaurant }];
        });
      },
      isFavorite: (menuItemId) => items.some((fav) => fav.menuItem.id === menuItemId),
      clearFavorites: () => setItems([]),
      isFavoritesOpen,
      openFavorites: () => setIsFavoritesOpen(true),
      closeFavorites: () => setIsFavoritesOpen(false),
      toggleFavorites: () => setIsFavoritesOpen((open) => !open),
    }),
    [items, isFavoritesOpen],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
