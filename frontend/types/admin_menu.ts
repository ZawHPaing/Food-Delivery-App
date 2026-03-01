export interface Category {
  id: number;
  name: string;
}

export interface MenuItem {
  id: number;
  menu_id: number;
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
  image_url: string | null;
  category_ids: number[];
  categories: Category[];
}

export interface Menu {
  id: number;
  restaurant_id: number;
  name: string | null;
  is_active: boolean;
  items: MenuItem[];
  restaurant_name?: string;
}

export interface RestaurantMenu {
  restaurant_id: number;
  restaurant_name: string;
  menus: Menu[];
}

export interface CreateMenuItem {
  name: string;
  description?: string | null;
  price_cents: number;
  is_available?: boolean;
  image_url?: string | null;
  category_ids: number[];
}

export interface CreateMenu {
  restaurant_id: number;
  name?: string | null;
  is_active?: boolean;
}

export interface UpdateMenuItem {
  name?: string;
  description?: string | null;
  price_cents?: number;
  is_available?: boolean;
  image_url?: string | null;
  category_ids?: number[];
}