"use client";

import React, { createContext, useContext, useReducer, useEffect, useMemo } from "react";
import type { CartItem, MenuItem, Restaurant } from "@/types";

// Cart State
interface CartState {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  restaurantImage: string | null;
}

// Cart Actions
type CartAction =
  | { type: "ADD_ITEM"; payload: { menuItem: MenuItem; restaurant: Pick<Restaurant, "id" | "name" | "image">; quantity?: number; specialInstructions?: string } }
  | { type: "REMOVE_ITEM"; payload: { menuItemId: number } }
  | { type: "UPDATE_QUANTITY"; payload: { menuItemId: number; quantity: number } }
  | { type: "UPDATE_INSTRUCTIONS"; payload: { menuItemId: number; instructions: string } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartState };

// Cart Context Value
interface CartContextValue extends CartState {
  // Actions
  addItem: (menuItem: MenuItem, restaurant: Pick<Restaurant, "id" | "name" | "image">, quantity?: number, specialInstructions?: string) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  updateInstructions: (menuItemId: number, instructions: string) => void;
  clearCart: () => void;
  
  // Computed values
  itemCount: number;
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  
  // Sidebar state
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Helpers
  getItemQuantity: (menuItemId: number) => number;
  isItemInCart: (menuItemId: number) => boolean;
}

const STORAGE_KEY = "foodie.cart";
const TAX_RATE = 0.08;
const DEFAULT_DELIVERY_FEE = 299; // $2.99

const initialState: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
  restaurantImage: null,
};

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { menuItem, restaurant, quantity = 1, specialInstructions } = action.payload;
      
      // If cart has items from a different restaurant, clear it first
      if (state.restaurantId !== null && state.restaurantId !== restaurant.id) {
        return {
          items: [{
            menuItem,
            quantity,
            specialInstructions,
            restaurant: { id: restaurant.id, name: restaurant.name, image: restaurant.image },
          }],
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantImage: restaurant.image ?? null,
        };
      }
      
      // Check if item already exists
      const existingIndex = state.items.findIndex(item => item.menuItem.id === menuItem.id);
      
      if (existingIndex >= 0) {
        // Update existing item quantity
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
          specialInstructions: specialInstructions || newItems[existingIndex].specialInstructions,
        };
        return { ...state, items: newItems };
      }
      
      // Add new item
      return {
        ...state,
        items: [...state.items, {
          menuItem,
          quantity,
          specialInstructions,
          restaurant: { id: restaurant.id, name: restaurant.name, image: restaurant.image },
        }],
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image ?? null,
      };
    }
    
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(item => item.menuItem.id !== action.payload.menuItemId);
      if (newItems.length === 0) {
        return initialState;
      }
      return { ...state, items: newItems };
    }
    
    case "UPDATE_QUANTITY": {
      const { menuItemId, quantity } = action.payload;
      if (quantity <= 0) {
        const newItems = state.items.filter(item => item.menuItem.id !== menuItemId);
        if (newItems.length === 0) {
          return initialState;
        }
        return { ...state, items: newItems };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity }
            : item
        ),
      };
    }
    
    case "UPDATE_INSTRUCTIONS": {
      return {
        ...state,
        items: state.items.map(item =>
          item.menuItem.id === action.payload.menuItemId
            ? { ...item, specialInstructions: action.payload.instructions }
            : item
        ),
      };
    }
    
    case "CLEAR_CART":
      return initialState;
    
    case "LOAD_CART":
      return action.payload;
    
    default:
      return state;
  }
}

// Context
const CartContext = createContext<CartContextValue | null>(null);

// Provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: "LOAD_CART", payload: parsed });
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Computed values
  const computedValues = useMemo(() => {
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalCents = state.items.reduce(
      (sum, item) => sum + item.menuItem.price_cents * item.quantity,
      0
    );
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const deliveryFeeCents = state.items.length > 0 ? DEFAULT_DELIVERY_FEE : 0;
    const totalCents = subtotalCents + taxCents + deliveryFeeCents;

    return { itemCount, subtotalCents, taxCents, deliveryFeeCents, totalCents };
  }, [state.items]);

  // Context value
  const value = useMemo<CartContextValue>(() => ({
    ...state,
    ...computedValues,
    isCartOpen,
    setIsCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    toggleCart: () => setIsCartOpen(prev => !prev),
    
    addItem: (menuItem, restaurant, quantity, specialInstructions) => {
      dispatch({
        type: "ADD_ITEM",
        payload: { menuItem, restaurant, quantity, specialInstructions },
      });
    },
    
    removeItem: (menuItemId) => {
      dispatch({ type: "REMOVE_ITEM", payload: { menuItemId } });
    },
    
    updateQuantity: (menuItemId, quantity) => {
      dispatch({ type: "UPDATE_QUANTITY", payload: { menuItemId, quantity } });
    },
    
    updateInstructions: (menuItemId, instructions) => {
      dispatch({ type: "UPDATE_INSTRUCTIONS", payload: { menuItemId, instructions } });
    },
    
    clearCart: () => {
      dispatch({ type: "CLEAR_CART" });
    },
    
    getItemQuantity: (menuItemId) => {
      const item = state.items.find(i => i.menuItem.id === menuItemId);
      return item?.quantity ?? 0;
    },
    
    isItemInCart: (menuItemId) => {
      return state.items.some(i => i.menuItem.id === menuItemId);
    },
  }), [state, computedValues, isCartOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

