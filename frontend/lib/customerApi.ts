// Same base as login/register (CustomerAuthProvider) — hardcoded so it never uses placeholder "server_ip".
const API_BASE = "http://localhost:8000";

const TOKEN_KEY = "foodie.customer.token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

async function customerFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error("Not logged in");
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = "Request failed";
    if (typeof data.detail === "string") msg = data.detail;
    else if (Array.isArray(data.detail) && data.detail[0]?.msg) msg = data.detail[0].msg;
    else if (data.detail && typeof data.detail === "object" && "message" in data.detail)
      msg = (data.detail as { message: string }).message;
    throw new Error(msg);
  }
  return data as T;
}

// ----- Profile -----
export interface CustomerProfile {
  user_id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export async function getProfile(): Promise<CustomerProfile> {
  return customerFetch<CustomerProfile>("/customer/profile");
}

export async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  phone?: string;
}): Promise<CustomerProfile> {
  return customerFetch<CustomerProfile>("/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ----- Addresses -----
export interface AddressRecord {
  id: number;
  user_id: number;
  street?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  label?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
}

export async function listAddresses(): Promise<AddressRecord[]> {
  return customerFetch<AddressRecord[]>("/customer/addresses");
}

export async function getAddress(id: number): Promise<AddressRecord> {
  return customerFetch<AddressRecord>(`/customer/addresses/${id}`);
}

export async function createAddress(data: {
  street?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  label?: string;
  is_default?: boolean;
}): Promise<AddressRecord> {
  return customerFetch<AddressRecord>("/customer/addresses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAddress(
  id: number,
  data: Partial<{
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    label: string;
    is_default: boolean;
  }>
): Promise<AddressRecord> {
  return customerFetch<AddressRecord>(`/customer/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAddress(id: number): Promise<void> {
  await customerFetch(`/customer/addresses/${id}`, { method: "DELETE" });
}

// ----- Vouchers -----
export interface VoucherValidateResult {
  valid: boolean;
  discount_cents: number;
  message: string;
}

export async function validateVoucher(params: {
  code: string;
  subtotal_cents: number;
  restaurant_id?: number;
}): Promise<VoucherValidateResult> {
  const sp = new URLSearchParams();
  sp.set("code", params.code);
  sp.set("subtotal_cents", String(params.subtotal_cents));
  if (params.restaurant_id != null) sp.set("restaurant_id", String(params.restaurant_id));
  return customerFetch<VoucherValidateResult>(`/customer/vouchers/validate?${sp.toString()}`);
}

// ----- Orders -----
export interface OrderItemRecord {
  id: number;
  order_id: number;
  menu_item_id?: number | null;
  quantity: number;
  price_cents: number;
  special_instructions?: string | null;
  name?: string | null;
}

export interface OrderRecord {
  id: number;
  user_id: number;
  restaurant_id?: number | null;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  delivery_address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  items: OrderItemRecord[];
  restaurant_name?: string | null;
}

export async function placeOrder(data: {
  restaurant_id: number;
  delivery_address?: string;
  address_id?: number | null;
  payment_method?: string;
  tax_cents?: number;
  delivery_fee_cents?: number;
  voucher_code?: string | null;
  items: { menu_item_id: number; quantity: number; special_instructions?: string }[];
}): Promise<{ message: string; order: OrderRecord }> {
  return customerFetch<{ message: string; order: OrderRecord }>(
    "/customer/orders",
    {
      method: "POST",
      body: JSON.stringify({
        restaurant_id: data.restaurant_id,
        delivery_address: data.delivery_address ?? "",
        address_id: data.address_id ?? null,
        payment_method: data.payment_method ?? "card",
        tax_cents: data.tax_cents ?? 0,
        delivery_fee_cents: data.delivery_fee_cents ?? 0,
        voucher_code: data.voucher_code ?? null,
        items: data.items,
      }),
    }
  );
}

export async function listOrders(): Promise<OrderRecord[]> {
  return customerFetch<OrderRecord[]>("/customer/orders");
}

export async function getOrder(id: number): Promise<OrderRecord> {
  return customerFetch<OrderRecord>(`/customer/orders/${id}`);
}

/** Full tracking info: order, restaurant, items, delivery, rider (for tracking page). */
export async function getOrderTrack(orderId: number): Promise<OrderTrackRecord> {
  return customerFetch<OrderTrackRecord>(`/customer/orders/${orderId}/track`);
}

export interface OrderTrackRecord {
  id: number;
  user_id?: number;
  status: string;
  delivery_address?: string | null;
  total_cents?: number;
  created_at?: string;
  updated_at?: string;
  restaurants?: { name?: string; image?: string };
  items?: Array<{ quantity: number; price_cents: number; menu_items?: { name?: string } }>;
  rider?: { users?: { first_name?: string; last_name?: string; phone?: string } };
  delivery?: { status?: string };
}

// ----- Reviews (optional use) -----
export async function createReview(data: {
  restaurant_id: number;
  order_id?: number;
  rating: number;
  comment: string;
}): Promise<unknown> {
  return customerFetch("/customer/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listMyReviews(): Promise<unknown[]> {
  return customerFetch<unknown[]>("/customer/reviews");
}

// ----- Notifications -----
export async function listNotifications(limit = 50): Promise<unknown[]> {
  return customerFetch<unknown[]>(`/customer/notifications?limit=${limit}`);
}
