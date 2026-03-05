// Same base as login/register and customerApi — hardcoded so we never use placeholder "server_ip".
const API_BASE = "http://localhost:8000";

/**
 * Public API for customer app: browse restaurants and menus (no auth).
 */

export interface RestaurantListItem {
  id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
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
  image_url?: string | null;
  city?: string | null;
  cuisine_type?: string | null;
  average_rating?: number | null;
  total_reviews?: number | null;
  menus: MenuFromApi[];
  menu_items: MenuItemFromApi[];
}

export async function getRestaurantsFromApi(): Promise<RestaurantListItem[]> {
  try {
    console.log('Fetching restaurants from API...');
    const res = await fetch(`${API_BASE}/restaurants`);
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      console.error('API response not OK:', res.status);
      return [];
    }
    
    // Handle both direct array and { restaurants: [...] } format
    const restaurants = Array.isArray(data.restaurants) ? data.restaurants : 
                       Array.isArray(data) ? data : [];
    
    console.log(`Fetched ${restaurants.length} restaurants`);
    
    // Log first restaurant to check image_url
    if (restaurants.length > 0) {
      console.log('First restaurant from API:', {
        id: restaurants[0].id,
        name: restaurants[0].name,
        image_url: restaurants[0].image_url
      });
    }
    
    return restaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
}

export async function getRestaurantWithMenuFromApi(
  restaurantId: number
): Promise<RestaurantWithMenuFromApi | null> {
  try {
    console.log(`Fetching restaurant ${restaurantId} from API...`);
    const res = await fetch(`${API_BASE}/restaurants/${restaurantId}`);
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok || !data || !data.id) {
      console.error(`Restaurant ${restaurantId} not found or error:`, res.status);
      return null;
    }
    
    // Log the response for debugging
    console.log('Restaurant API response:', {
      id: data.id,
      name: data.name,
      image_url: data.image_url
    });
    
    return data as RestaurantWithMenuFromApi;
  } catch (error) {
    console.error(`Error fetching restaurant ${restaurantId}:`, error);
    return null;
  }
}
