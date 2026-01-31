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
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
            {restaurantName && (
              <p className="text-sm text-gray-500">from {restaurantName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex flex-col h-[calc(100%-80px)]">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    {/* Item Image */}
                    {item.menuItem.image && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={item.menuItem.image}
                          alt={item.menuItem.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{item.menuItem.name}</h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {formatPrice(item.menuItem.price_cents)} each
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:border-[#e4002b] hover:text-[#e4002b] flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-6 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-[#e4002b] hover:bg-[#c41e3a] text-white flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        
                        <span className="font-semibold text-gray-900">
                          {formatPrice(item.menuItem.price_cents * item.quantity)}
                        </span>
                      </div>
                      
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="self-start p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Clear Cart Button */}
                <button
                  onClick={clearCart}
                  className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  Clear all items
                </button>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                    <span className="text-gray-900">{formatPrice(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="text-gray-900">{formatPrice(deliveryFeeCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{formatPrice(taxCents)}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-[#e4002b] text-lg">{formatPrice(totalCents)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full py-4 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white font-bold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02] text-center"
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

