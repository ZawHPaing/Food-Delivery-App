"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/_providers/CartProvider";
import { formatPrice } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    restaurantName,
    restaurantImage,
    itemCount,
    subtotalCents,
    taxCents,
    deliveryFeeCents,
    totalCents,
    clearCart,
  } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    zipCode: "",
    instructions: "",
    paymentMethod: "card", // card | cash
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/consumer_module");
    }
  }, [items, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setFormData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Clear cart and redirect to success page (or home with success message)
    clearCart();
    alert("Order placed successfully! (This is a demo)");
    router.push("/consumer_module");
  };

  if (items.length === 0) {
    return null; // Or a loading spinner while redirecting
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Forms */}
          <div className="lg:col-span-2 space-y-6">
            <form id="checkout-form" onSubmit={handleSubmit}>
              {/* Contact Information */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#ff6600]/10 text-[#ff6600] flex items-center justify-center text-sm">1</span>
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all"
                      placeholder="Doe"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#ff6600]/10 text-[#ff6600] flex items-center justify-center text-sm">2</span>
                  Delivery Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apartment / Suite (Optional)</label>
                    <input
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all"
                      placeholder="Apt 4B"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all"
                      placeholder="10001"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions (Optional)</label>
                    <textarea
                      name="instructions"
                      rows={2}
                      value={formData.instructions}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 outline-none transition-all resize-none"
                      placeholder="Gate code, drop-off location, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#ff6600]/10 text-[#ff6600] flex items-center justify-center text-sm">3</span>
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                      formData.paymentMethod === "card"
                        ? "border-[#e4002b] bg-[#e4002b]/5 ring-1 ring-[#e4002b]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handlePaymentMethodChange("card")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={() => {}}
                      className="w-5 h-5 text-[#e4002b] focus:ring-[#e4002b]"
                    />
                    <div className="ml-4 flex-1">
                      <span className="block font-medium text-gray-900">Credit / Debit Card</span>
                      <span className="block text-sm text-gray-500">Pay securely with your card</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-5 bg-gray-200 rounded"></div>
                      <div className="w-8 h-5 bg-gray-200 rounded"></div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                      formData.paymentMethod === "cash"
                        ? "border-[#e4002b] bg-[#e4002b]/5 ring-1 ring-[#e4002b]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handlePaymentMethodChange("cash")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === "cash"}
                      onChange={() => {}}
                      className="w-5 h-5 text-[#e4002b] focus:ring-[#e4002b]"
                    />
                    <div className="ml-4">
                      <span className="block font-medium text-gray-900">Cash on Delivery</span>
                      <span className="block text-sm text-gray-500">Pay when your order arrives</span>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-8 overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                {restaurantName && (
                  <p className="text-sm text-gray-500 mt-1">from {restaurantName}</p>
                )}
              </div>
              
              <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-900">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        <span className="text-gray-600">
                          {formatPrice(item.menuItem.price_cents * item.quantity)}
                        </span>
                      </div>
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-500 italic">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium text-gray-900">{formatPrice(deliveryFeeCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">{formatPrice(taxCents)}</span>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <div className="text-right">
                    <span className="block font-bold text-[#e4002b] text-2xl">{formatPrice(totalCents)}</span>
                    <span className="text-xs text-gray-500">(Incl. tax & fees)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className={`w-full mt-6 py-4 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    isProcessing ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
