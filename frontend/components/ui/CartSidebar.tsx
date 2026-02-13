"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/_providers/CartProvider";
import { formatPrice } from "@/types";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const {
    items,
    restaurantName,
    itemCount,
    subtotalCents,
    taxCents,
    deliveryFeeCents,
    totalCents,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Your Cart</h2>
            {restaurantName && (
              <p className="text-gray-500 font-medium">from {restaurantName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 text-center">
                Add items from a restaurant to start your order
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex gap-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 shadow-sm">
                    {/* Item Image */}
                    {item.menuItem.image && (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                        <Image
                          src={item.menuItem.image}
                          alt={item.menuItem.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[#0F172A] text-lg leading-tight">{item.menuItem.name}</h4>
                          <p className="text-gray-400 font-medium">
                            {formatPrice(item.menuItem.price_cents)} each
                          </p>
                        </div>
                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.menuItem.id)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Quantity Controls and Subtotal */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-white rounded-full p-1 border border-gray-100 shadow-sm gap-3">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-4 text-center font-bold text-[#0F172A]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-[#FF4D17] hover:bg-[#E33E0F] text-white flex items-center justify-center transition-colors shadow-sm"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        
                        <span className="font-bold text-[#0F172A] text-lg">
                          {formatPrice(item.menuItem.price_cents * item.quantity)}
                        </span>
                      </div>
                      
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Clear Cart Button */}
                <button
                  onClick={clearCart}
                  className="w-full py-4 text-gray-400 hover:text-red-500 font-medium transition-colors"
                >
                  Clear all items
                </button>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-100 p-6 pt-4 bg-white space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-400">Subtotal ({itemCount} items)</span>
                    <span className="text-[#0F172A]">{formatPrice(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-400">Delivery Fee</span>
                    <span className="text-[#0F172A]">{formatPrice(deliveryFeeCents)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-400">Tax</span>
                    <span className="text-[#0F172A]">{formatPrice(taxCents)}</span>
                  </div>
                  <div className="h-px bg-gray-100 my-2" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-2xl font-black text-[#0F172A]">Total</span>
                    <span className="text-2xl font-black text-[#E4002B]">{formatPrice(totalCents)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  href="/consumer_module/checkout"
                  onClick={onClose}
                  className="block w-full py-5 bg-[#FF4D17] hover:bg-[#E33E0F] text-white text-lg font-black rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-95 text-center"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

