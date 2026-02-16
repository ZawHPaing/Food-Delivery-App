"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MenuCategory from "@/components/ui/MenuCategory";
import MenuItemCard from "@/components/ui/MenuItemCard";
import CartSidebar from "@/components/ui/CartSidebar";
import { useCart } from "@/app/_providers/CartProvider";
import { formatPrice } from "@/types";
import type { Category, MenuItemWithCategory, Review } from "@/types";
import {
  getRestaurantWithMenu,
  getPopularItems,
  getRestaurantReviews,
} from "@/data/restaurants";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantPage({ params }: PageProps) {
  const { id } = use(params);
  const restaurantId = parseInt(id, 10);
  const restaurant = getRestaurantWithMenu(restaurantId);

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const { itemCount, totalCents } = useCart();

  // Handle scroll for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyNav(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!restaurant) {
    notFound();
  }

  const popularItems = getPopularItems(restaurantId);
  const reviews = getRestaurantReviews(restaurantId);
  const menu = restaurant.menus[0];
  const categories = restaurant.categories;

  // Group items by category
  const itemsByCategory = categories.reduce((acc, category) => {
    const items = menu.items.filter((item) =>
      item.categories.some((c) => c.id === category.id)
    );
    if (items.length > 0) {
      acc[category.id] = items;
    }
    return acc;
  }, {} as Record<number, MenuItemWithCategory[]>);

  const scrollToCategory = (categoryId: number) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 150;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-[#e4002b] to-[#ff6600]">
        {restaurant.image && (
          <Image
            src={restaurant.image}
            alt={restaurant.name}
            fill
            className="object-cover opacity-30"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Back Button */}
        <Link
          href="/consumer_module"
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {restaurant.isOpen ? (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                      Open Now
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      Closed
                    </span>
                  )}
                  <span className="text-white/80 text-sm">
                    {restaurant.cuisine_type}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {restaurant.name}
                </h1>
                <p className="text-white/80 max-w-2xl line-clamp-2">
                  {restaurant.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Stats Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ff6600]/10">
                  <svg
                    className="w-5 h-5 text-[#ff6600] fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {restaurant.average_rating.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {restaurant.total_reviews.toLocaleString()} reviews
                  </div>
                </div>
              </div>

              {/* Delivery Time */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {restaurant.deliveryTime}
                  </div>
                  <div className="text-xs text-gray-500">Delivery</div>
                </div>
              </div>

              {/* Distance */}
              {restaurant.distance && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {restaurant.distance}
                    </div>
                    <div className="text-xs text-gray-500">Away</div>
                  </div>
                </div>
              )}

              {/* Delivery Fee */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-50">
                  <svg
                    className="w-5 h-5 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {restaurant.deliveryFee}
                  </div>
                  <div className="text-xs text-gray-500">Delivery Fee</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full border border-gray-200 hover:border-[#e4002b] hover:text-[#e4002b] transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button className="p-2 rounded-full border border-gray-200 hover:border-[#e4002b] hover:text-[#e4002b] transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Category Nav */}
      <div
        className={`bg-white border-b border-gray-200 sticky top-[88px] z-20 transition-all duration-300 ${
          showStickyNav
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {popularItems.length > 0 && (
              <button
                onClick={() => scrollToCategory(0)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === 0
                    ? "bg-[#e4002b] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ⭐ Popular
              </button>
            )}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? "bg-[#e4002b] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-8">
          {/* Menu Section */}
          <div className="flex-1">
            {/* Popular Items */}
            {popularItems.length > 0 && (
              <div className="mb-8" id="category-0">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">⭐</span> Popular Items
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {popularItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      restaurant={{
                        id: restaurant.id,
                        name: restaurant.name,
                        image: restaurant.image,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category Sections */}
            {categories.map((category) => (
              <MenuCategory
                key={category.id}
                category={category}
                items={itemsByCategory[category.id] || []}
                restaurant={{
                  id: restaurant.id,
                  name: restaurant.name,
                  image: restaurant.image,
                }}
              />
            ))}
          </div>

          {/* Sidebar - Reviews */}
          <div className="hidden xl:block w-80 shrink-0">
            <div className="sticky top-48 space-y-6">
              {/* Reviews Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Reviews</h3>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-5 h-5 text-[#ff6600] fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="font-bold text-gray-900">
                      {restaurant.average_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({restaurant.total_reviews})
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>

                {reviews.length > 3 && (
                  <button className="w-full mt-4 py-2 text-sm font-semibold text-[#e4002b] hover:bg-red-50 rounded-lg transition-colors">
                    View all {reviews.length} reviews
                  </button>
                )}
              </div>

              {/* Restaurant Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">
                  Restaurant Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-gray-600">{restaurant.city}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-gray-600">
                      Open daily 10:00 AM - 10:00 PM
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="text-gray-600">+95 9 xxx xxx xxx</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="font-bold">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="h-6 w-px bg-white/30" />
            <span className="font-bold">{formatPrice(totalCents)}</span>
          </button>
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

// Review Card Component
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{review.reviewer_name}</span>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${
                i < review.rating
                  ? "text-[#ff6600] fill-current"
                  : "text-gray-300"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
      {review.created_at && (
        <span className="text-xs text-gray-400 mt-1 block">
          {review.created_at}
        </span>
      )}
    </div>
  );
}

