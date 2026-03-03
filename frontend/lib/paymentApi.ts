const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CreatePaymentIntentRequest {
  order_id: number;
  payment_method: string;
  success_url: string;
  cancel_url: string;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  order_id: number;
  amount_cents: number;
}

export async function createPaymentIntent(
  data: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> {
  // Get token from localStorage using the correct key from CustomerAuthProvider
  const token = localStorage.getItem('foodie.customer.token');  // Changed from 'access_token'
  
  console.log('Token being sent:', token ? 'Present' : 'Missing'); // Debug log
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,  // Format is exactly "Bearer [token]"
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Payment intent error:', response.status, error);
    
    if (response.status === 401) {
      // Token might be expired - redirect to login
      localStorage.removeItem('foodie.customer.token');
      localStorage.removeItem('foodie.customer.auth');
      window.location.href = '/login?redirect=' + encodeURIComponent('/consumer_module/checkout');
      throw new Error('Session expired. Please log in again.');
    }
    
    throw new Error(error.detail || 'Failed to create payment intent');
  }

  return response.json();
}