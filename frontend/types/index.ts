// Types matching the database schema

// User Types
export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'customer' | 'rider' | 'admin';
  created_at: string;
  updated_at: string;
}

// Restaurant Types
export interface Restaurant {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  city: string;
  cuisine_type: string;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  // Extended fields for UI
  image?: string;
  deliveryTime?: string;
  deliveryFee?: string;
  distance?: string;
  isOpen?: boolean;
}

// Menu Types
export interface Menu {
  id: number;
  restaurant_id: number;
  name: string;
  is_active: boolean;
}

// Menu Item Types
export interface MenuItem {
  id: number;
  menu_id: number;
  name: string;
  description: string;
  price_cents: number;
  is_available: boolean;
  // Extended fields for UI
  image?: string;
  calories?: number;
  isPopular?: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
}

// Category Types
export interface Category {
  id: number;
  name: string;
}

// Menu Item with Category (joined data)
export interface MenuItemWithCategory extends MenuItem {
  categories: Category[];
}

// Restaurant with Menu (full restaurant data for detail page)
export interface RestaurantWithMenu extends Restaurant {
  menus: MenuWithItems[];
  categories: Category[];
}

// Menu with Items
export interface MenuWithItems extends Menu {
  items: MenuItemWithCategory[];
}

// Order Types
export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  subtotal_cents: number;
  tax_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  delivery_address: string;
  created_at: string;
  updated_at: string;
}

// Order Item Types
export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price_cents: number;
  special_instructions: string;
}

// Cart Types (for client state)
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
  restaurant: Pick<Restaurant, 'id' | 'name' | 'image'>;
}

export interface Cart {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

// Review Types
export interface Review {
  id: number;
  order_id: number;
  reviewer_id: number;
  restaurant_id: number;
  rating: number;
  comment: string;
  // Extended for UI
  reviewer_name?: string;
  created_at?: string;
}

// Address Types
export interface Address {
  id: number;
  user_id: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  label: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

// Promotion Types
export interface Promotion {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  amount_cents: number;
  starts_at: string;
  ends_at: string;
}

// Payment Types
export interface Payment {
  id: number;
  order_id: number;
  user_id: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount_cents: number;
  payment_method: 'card' | 'cash' | 'wallet';
  transaction_id: string;
  paid_at: string;
}

// Delivery Types
export interface Delivery {
  id: number;
  order_id: number;
  rider_id: number;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  picked_up_at: string | null;
  delivered_at: string | null;
  estimated_arrival_time: number; // minutes
}

// Wallet Types
export interface Wallet {
  id: number;
  user_id: number;
  balance_cents: number;
}

// Utility type for price formatting
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Utility type for calculating cart totals
export function calculateCartTotals(items: CartItem[], deliveryFeeCents: number = 299, taxRate: number = 0.08): Omit<Cart, 'items' | 'restaurantId' | 'restaurantName'> {
  const subtotalCents = items.reduce((sum, item) => sum + (item.menuItem.price_cents * item.quantity), 0);
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents + deliveryFeeCents;
  
  return {
    subtotalCents,
    taxCents,
    deliveryFeeCents,
    totalCents,
  };
}

