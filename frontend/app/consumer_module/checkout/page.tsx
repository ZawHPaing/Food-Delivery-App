"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/app/_providers/CartProvider";
import { useCustomerAuth } from "@/app/_providers/CustomerAuthProvider";
import { listAddresses, placeOrder, validateVoucher, type AddressRecord } from "@/lib/customerApi";
import { createPaymentIntent } from "@/lib/paymentApi";
import { formatPrice } from "@/types";
import StripePaymentForm from "@/components/payment/StripePaymentForm";

// Stripe test cards
const TEST_CARDS = [
  { brand: "Visa", number: "4242 4242 4242 4242", success: true },
  { brand: "Visa (3D Secure)", number: "4000 0025 0000 3155", success: true },
  { brand: "Mastercard", number: "5555 5555 5555 4444", success: true },
  { brand: "Mastercard (3D Secure)", number: "5200 0000 0000 1005", success: true },
  { brand: "American Express", number: "3782 822463 10005", success: true },
  { brand: "Declined", number: "4000 0000 0000 0002", success: false },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn } = useCustomerAuth();
  const {
    items,
    restaurantId,
    restaurantName,
    subtotalCents,
    taxCents,
    deliveryFeeCents,
    totalCents,
    clearCart,
  } = useCart();

  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("cash");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stripe states
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [showTestCards, setShowTestCards] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('Token from localStorage:', token ? 'Present' : 'Missing');
    if (token) {
      console.log('Token first 20 chars:', token.substring(0, 20));
      
      // Try to decode JWT manually (just for debugging)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        console.log('Token payload:', payload);
      } catch (e) {
        console.error('Could not decode token:', e);
      }
    }
  }, []);

  // Require login
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLoggedIn) {
      router.replace("/login?redirect=" + encodeURIComponent("/consumer_module/checkout"));
      return;
    }
  }, [isLoggedIn, router]);
  // Load addresses when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    listAddresses()
      .then((list) => {
        setAddresses(list);
        const defaultAddr = list.find((a) => a.is_default) ?? list[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setUseManualAddress(false);
        } else if (list.length === 0) {
          setUseManualAddress(true);
        }
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoadingAddresses(false));
  }, [isLoggedIn]);

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && restaurantId === null) return;
    if (items.length === 0) {
      router.push("/consumer_module");
    }
  }, [items.length, restaurantId, router]);

  const totalWithDiscount = Math.max(0, totalCents - discountCents);

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim();
    if (!code || !restaurantId) return;
    setVoucherError(null);
    setVoucherLoading(true);
    try {
      const res = await validateVoucher({
        code,
        subtotal_cents: subtotalCents,
        restaurant_id: restaurantId,
      });
      if (res.valid) {
        setAppliedVoucherCode(code);
        setDiscountCents(res.discount_cents);
      } else {
        setVoucherError(res.message || "Invalid voucher");
        setAppliedVoucherCode(null);
        setDiscountCents(0);
      }
    } catch {
      setVoucherError("Failed to validate voucher");
      setAppliedVoucherCode(null);
      setDiscountCents(0);
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucherCode(null);
    setDiscountCents(0);
    setVoucherCode("");
    setVoucherError(null);
  };

  const getDeliveryAddressText = (): string => {
    if (useManualAddress) {
      const parts = [
        manualAddress.street,
        manualAddress.city,
        manualAddress.state,
        manualAddress.postal_code,
        manualAddress.country,
      ].filter(Boolean);
      return parts.join(", ");
    }
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (!addr) return "";
    return [addr.street, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean).join(", ");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || items.length === 0) return;
    const deliveryAddress = getDeliveryAddressText().trim();
    if (!deliveryAddress) {
      setError("Please select or enter a delivery address.");
      return;
    }
    setError(null);
    setIsPlacing(true);
    try {
      const result = await placeOrder({
        restaurant_id: restaurantId,
        delivery_address: deliveryAddress,
        address_id: !useManualAddress ? selectedAddressId ?? undefined : undefined,
        payment_method: paymentMethod,
        tax_cents: taxCents,
        delivery_fee_cents: deliveryFeeCents,
        voucher_code: appliedVoucherCode ?? undefined,
        items: items.map((item) => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          special_instructions: item.specialInstructions ?? undefined,
        })),
      });

      const orderId = result.order.id;

      if (paymentMethod === "card") {
        // Create Stripe payment intent
        const paymentIntent = await createPaymentIntent({
          order_id: orderId,
          payment_method: "card",
          success_url: `${window.location.origin}/consumer_module/orders/${orderId}/success`,
          cancel_url: `${window.location.origin}/consumer_module/orders/${orderId}`,
        });
        
        setClientSecret(paymentIntent.client_secret);
        setPlacedOrderId(orderId);
        setShowStripeForm(true);
        setIsPlacing(false);
      } else {
        // Cash on delivery - redirect to order page
        clearCart();
        router.push(`/consumer_module/orders/${orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setIsPlacing(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    router.push(`/consumer_module/orders/${placedOrderId}/success`);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setShowStripeForm(false);
    setClientSecret(null);
    setIsPlacing(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <p className="text-gray-600">Redirecting to sign in…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  // Show Stripe payment form if card payment is selected
  if (showStripeForm && clientSecret) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h1>
            
            {/* Test Cards Info */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowTestCards(!showTestCards)}
                className="text-sm text-[#e4002b] hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showTestCards ? "Hide" : "Show"} test cards
              </button>
              
              {showTestCards && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-2">Stripe Test Cards</h3>
                  <div className="space-y-2 text-sm">
                    {TEST_CARDS.map((card) => (
                      <div key={card.number} className="flex items-center justify-between">
                        <span className="text-gray-700">{card.brand}:</span>
                        <code className="px-2 py-1 bg-gray-200 rounded text-gray-800">{card.number}</code>
                        <span className={card.success ? "text-green-600" : "text-red-600"}>
                          {card.success ? "✓ Success" : "✗ Declined"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Use any future expiration date, any 3-digit CVC, and any postal code.
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
              <p className="text-2xl font-bold text-[#e4002b]">{formatPrice(totalWithDiscount)}</p>
              <p className="text-sm text-gray-500 mt-1">Order #{placedOrderId}</p>
            </div>

            {/* Stripe Payment Form */}
            <StripePaymentForm
              clientSecret={clientSecret}
              orderId={placedOrderId!}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />

            <button
              onClick={() => {
                setShowStripeForm(false);
                setClientSecret(null);
                setIsPlacing(false);
              }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original checkout form
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/consumer_module"
            className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-[#e4002b]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery address */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#ff6600]/10 text-[#ff6600] flex items-center justify-center text-sm">1</span>
                Delivery address
              </h2>
              {loadingAddresses ? (
                <p className="text-gray-500">Loading addresses…</p>
              ) : (
                <>
                  {addresses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Saved addresses</label>
                      {addresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                            !useManualAddress && selectedAddressId === addr.id
                              ? "border-[#e4002b] bg-[#e4002b]/5 ring-1 ring-[#e4002b]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={!useManualAddress && selectedAddressId === addr.id}
                            onChange={() => {
                              setUseManualAddress(false);
                              setSelectedAddressId(addr.id);
                            }}
                            className="mt-1 text-[#e4002b] focus:ring-[#e4002b]"
                          />
                          <div>
                            {addr.label && (
                              <span className="text-sm font-medium text-gray-700">{addr.label}</span>
                            )}
                            <p className="text-gray-600 text-sm">
                              {[addr.street, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="radio"
                      name="address"
                      checked={useManualAddress}
                      onChange={() => setUseManualAddress(true)}
                      className="text-[#e4002b] focus:ring-[#e4002b]"
                    />
                    <span className="font-medium text-gray-900">Enter address manually</span>
                  </label>
                  {useManualAddress && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          placeholder="Street address"
                          value={manualAddress.street}
                          onChange={(e) => setManualAddress((p) => ({ ...p, street: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          required={useManualAddress}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="City"
                        value={manualAddress.city}
                        onChange={(e) => setManualAddress((p) => ({ ...p, city: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        required={useManualAddress}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={manualAddress.state}
                        onChange={(e) => setManualAddress((p) => ({ ...p, state: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        required={useManualAddress}
                      />
                      <input
                        type="text"
                        placeholder="Postal code"
                        value={manualAddress.postal_code}
                        onChange={(e) => setManualAddress((p) => ({ ...p, postal_code: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        required={useManualAddress}
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={manualAddress.country}
                        onChange={(e) => setManualAddress((p) => ({ ...p, country: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        required={useManualAddress}
                      />
                    </div>
                  )}
                  <Link href="/consumer_module/profile" className="inline-block mt-2 text-sm text-[#e4002b] hover:underline">
                    Manage addresses in profile
                  </Link>
                </>
              )}
            </div>

            {/* Voucher */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#ff6600]/10 text-[#ff6600] flex items-center justify-center text-sm">2</span>
                Voucher / promo code
              </h2>
              {appliedVoucherCode ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="font-medium text-green-800">{appliedVoucherCode} applied (−{formatPrice(discountCents)})</span>
                  <button type="button" onClick={removeVoucher} className="text-sm text-green-700 hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={voucherCode}
                    onChange={(e) => { setVoucherCode(e.target.value); setVoucherError(null); }}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading || !voucherCode.trim()}
                    className="px-4 py-3 bg-[#e4002b] text-white font-semibold rounded-xl hover:bg-[#c20025] disabled:opacity-50"
                  >
                    {voucherLoading ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {voucherError && <p className="mt-2 text-sm text-red-600">{voucherError}</p>}
            </div>

            {/* Payment - Updated with Stripe option */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#ff6600]/10 text-[#ff6600] flex items-center justify-center text-sm">3</span>
                Payment
              </h2>
              <div className="space-y-3">
                {/* Cash on delivery option */}
                <label
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "cash" ? "border-[#e4002b] bg-[#e4002b]/5 ring-1 ring-[#e4002b]" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      className="w-5 h-5 text-[#e4002b] focus:ring-[#e4002b]"
                    />
                    <span className="font-medium">Cash on delivery</span>
                  </div>
                  <span className="text-sm text-gray-500">Pay in cash to the rider</span>
                </label>
                
                {/* Card payment option with Stripe */}
                <label
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === "card" ? "border-[#e4002b] bg-[#e4002b]/5 ring-1 ring-[#e4002b]" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="w-5 h-5 text-[#e4002b] focus:ring-[#e4002b]"
                    />
                    <span className="font-medium">Credit / Debit Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Pay with Stripe</span>
                    <svg className="h-6 w-auto" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="36" height="24" rx="4" fill="#635BFF"/>
                      <path d="M14.5 8H12V16H14.5V8Z" fill="white"/>
                      <path d="M22.5 8H20V16H22.5V8Z" fill="white"/>
                      <path d="M28 12C28 10.5 27 9.5 25.5 9.5C24 9.5 23 10.5 23 12C23 13.5 24 14.5 25.5 14.5C27 14.5 28 13.5 28 12Z" fill="white"/>
                      <path d="M18.5 9.5C17.7 9.5 17 10 16.7 10.8V9.5H14.5V16H16.7V12.5C16.7 11.7 17.2 11 18 11C18.8 11 19.2 11.6 19.2 12.4V16H21.4V12C21.4 10.4 20.1 9.5 18.5 9.5Z" fill="white"/>
                    </svg>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-8 overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Order summary</h2>
                {restaurantName && <p className="text-sm text-gray-500 mt-1">from {restaurantName}</p>}
              </div>
              <div className="p-6 max-h-[320px] overflow-y-auto space-y-4">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between gap-2">
                    <span className="text-gray-900">
                      {item.quantity}× {item.menuItem.name}
                    </span>
                    <span className="text-gray-600 shrink-0">
                      {formatPrice(item.menuItem.price_cents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-gray-900">{formatPrice(deliveryFeeCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">{formatPrice(taxCents)}</span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Voucher discount</span>
                    <span className="font-medium">−{formatPrice(discountCents)}</span>
                  </div>
                )}
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-bold text-[#e4002b] text-2xl">{formatPrice(totalWithDiscount)}</span>
                </div>
                <button
                  type="submit"
                  disabled={isPlacing}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white font-bold rounded-xl shadow-lg disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  {isPlacing ? "Placing order…" : paymentMethod === "card" ? "Proceed to Payment" : "Place order"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}