export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  is_available: boolean;
  image_url?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_cents: number;
}

export interface Order {
  id: string;
  total_cents: number;
  status: 'Pending' | 'Paid' | 'Preparing' | 'Ready' | 'Delivered';
  created_at: string;
}

export interface Rider {
  id: string;
  name: string;
  photo: string;
  distance_km: number;
  is_available: boolean;
}

export interface Delivery {
  id: string;
  order_id: string;
  rider_id: string | null;
  status: 'Requesting' | 'Accepted' | 'Picked Up' | 'Delivered';
  picked_up_at: string | null;
}

export interface TrackingPoint {
  id: string;
  delivery_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}
