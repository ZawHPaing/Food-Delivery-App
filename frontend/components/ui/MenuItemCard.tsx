"use client";

import Image from "next/image";
import { useState } from "react";
import { Heart } from "lucide-react";
import type { MenuItemWithCategory, Restaurant } from "@/types";
import { formatPrice } from "@/types";
import { useCart } from "@/app/_providers/CartProvider";
import { useFavorites } from "@/app/_providers/FavoritesProvider";

interface MenuItemCardProps {
  item: MenuItemWithCategory;
  restaurant: Pick<Restaurant, "id" | "name" | "image">;
  onItemClick?: (item: MenuItemWithCategory) => void;
}

export default function MenuItemCard({ item, restaurant, onItemClick }: MenuItemCardProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAdding, setIsAdding] = useState(false);
  const [isFavAnimating, setIsFavAnimating] = useState(false);

  const quantity = getItemQuantity(item.id);
  const isInCart = quantity > 0;
  const isFav = isFavorite(item.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    addItem(item, restaurant);
    setTimeout(() => setIsAdding(false), 300);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(item.id, quantity - 1);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFav) {
      setIsFavAnimating(true);
      setTimeout(() => setIsFavAnimating(false), 300);
    }
    toggleFavorite(item, restaurant);
  };

  return (
    <div
      onClick={() => onItemClick?.(item)}
      className={`bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group ${
        !item.is_available ? "opacity-60" : ""
      }`}
    >
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-[#e4002b] transition-colors line-clamp-1">
              {item.name}
            </h3>
            {item.isPopular && (
              <span className="shrink-0 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                Popular
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[40px]">
            {item.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.isSpicy && (
              <span className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">
                🌶️ Spicy
              </span>
            )}
            {item.isVegetarian && (
              <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">
                🥬 Vegetarian
              </span>
            )}
            {item.calories && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {item.calories} cal
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#e4002b]">
              {formatPrice(item.price_cents)}
            </span>

            {item.is_available ? (
              isInCart ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDecrement}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-900">{quantity}</span>
                  <button
                    onClick={handleIncrement}
                    className="w-8 h-8 rounded-full bg-[#e4002b] hover:bg-[#c41e3a] flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isAdding
                      ? "bg-green-500 text-white scale-105"
                      : "bg-[#e4002b] hover:bg-[#c41e3a] text-white hover:shadow-md"
                  }`}
                >
                  {isAdding ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added
                    </span>
                  ) : (
                    "Add"
                  )}
                </button>
              )
            ) : (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-400">
                Unavailable
              </span>
            )}
          </div>
        </div>

        {item.image && (
          <div className="relative w-32 h-32 m-3 rounded-lg overflow-hidden shrink-0">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="128px"
            />
            {item.isPopular && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            )}

            <button
              onClick={handleFavoriteToggle}
              className="absolute top-2 right-2 z-10"
            >
              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                  isFav
                    ? "bg-white text-[#e4002b] shadow-lg scale-110"
                    : "bg-black/60 text-white hover:scale-105"
                }`}
              >
                {isFavAnimating && (
                  <span className="absolute inset-0 rounded-full border-2 border-[#e4002b]/60 animate-ping" />
                )}
                <Heart
                  className={`h-4 w-4 ${
                    isFav ? "fill-current" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

