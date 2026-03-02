// Same base as login/register and customerApi — hardcoded so we never use placeholder "server_ip".
const API_BASE = "http://localhost:8000";

/**
 * Public API for customer app: browse restaurants and menus (no auth).
 */

export interface RestaurantListItem {
  id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  cuisine_type?: string | null;
  average_rating?: number | null;
  total_reviews?: number | null;
}

export interface MenuItemFromApi {
  id: number;
  menu_id: number;
  name: string;
  description?: string | null;
  price_cents: number;
  is_available?: boolean;
  image_url?: string | null;
}

export interface MenuFromApi {
  id: number;
  name: string | null;
  restaurant_id: number;
}

export interface RestaurantWithMenuFromApi {
  id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  cuisine_type?: string | null;
  average_rating?: number | null;
  total_reviews?: number | null;
  menus: MenuFromApi[];
  menu_items: MenuItemFromApi[];
}

export async function getRestaurantsFromApi(): Promise<RestaurantListItem[]> {
  try {
    const res = await fetch(`${API_BASE}/restaurants`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return Array.isArray(data.restaurants) ? data.restaurants : [];
  } catch {
    return [];
  }
}

export async function getRestaurantWithMenuFromApi(
  restaurantId: number
): Promise<RestaurantWithMenuFromApi | null> {
  try {
    const res = await fetch(`${API_BASE}/restaurants/${restaurantId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || !data.id) return null;
    return data as RestaurantWithMenuFromApi;
  } catch {
    return null;
  }
}
