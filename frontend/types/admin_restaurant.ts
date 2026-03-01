export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  cuisine_type: string | null;
  is_approved: boolean;
  created_at: string;
  average_rating: number;
  total_reviews: number;
  menu_count?: number;
  order_count?: number;
}

export interface RestaurantStats {
  total_restaurants: number;
  approved_restaurants: number;
  pending_approval: number;
  restaurants_by_city: Record<string, number>;
  restaurants_by_cuisine: Record<string, number>;
}

export interface CreateRestaurant {
  name: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  cuisine_type?: string | null;
  is_approved?: boolean;
}