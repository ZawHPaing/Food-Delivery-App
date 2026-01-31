"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export type SortOption = 
  | "rating-desc"
  | "rating-asc"
  | "delivery-time-asc"
  | "delivery-time-desc"
  | "distance-asc"
  | "distance-desc"
  | "price-asc"
  | "price-desc"
  | "popularity";

export interface FilterOptions {
  cuisines: string[];
  priceRange: {
    min: number;
    max: number;
  } | null;
  deliveryFee: "free" | "any" | null;
  minRating: number | null;
  maxDeliveryTime: number | null; // in minutes
}

interface FilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions, sortBy: SortOption) => void;
  initialFilters?: FilterOptions;
  initialSort?: SortOption;
}

const cuisineOptions = [
  "Fast Food",
  "Pizza",
  "Asian",
  "Italian",
  "Mexican",
  "Japanese",
  "Chinese",
  "Indian",
  "Thai",
  "Burgers",
  "Seafood",
  "Desserts",
  "Healthy",
  "Beverages",
];

export default function FilterOverlay({
  isOpen,
  onClose,
  onApply,
  initialFilters,
  initialSort = "popularity",
}: FilterOverlayProps) {
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      cuisines: [],
      priceRange: null,
      deliveryFee: null,
      minRating: null,
      maxDeliveryTime: null,
    }
  );

  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 100,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCuisineToggle = (cuisine: string) => {
    setFilters((prev) => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter((c) => c !== cuisine)
        : [...prev.cuisines, cuisine],
    }));
  };

  const handleApply = () => {
    onApply(filters, sortBy);
    onClose();
  };

  const handleClearAll = () => {
    setFilters({
      cuisines: [],
      priceRange: null,
      deliveryFee: null,
      minRating: null,
      maxDeliveryTime: null,
    });
    setPriceRange({ min: 0, max: 100 });
    setSortBy("popularity");
  };

  const activeFiltersCount =
    filters.cuisines.length +
    (filters.priceRange ? 1 : 0) +
    (filters.deliveryFee ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.maxDeliveryTime ? 1 : 0);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Overlay Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white z-[70] shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800">Filters & Sort</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Sort Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sort By</h3>
            <div className="space-y-2">
              {[
                { value: "popularity", label: "Most Popular" },
                { value: "rating-desc", label: "Highest Rated" },
                { value: "rating-asc", label: "Lowest Rated" },
                { value: "delivery-time-asc", label: "Fastest Delivery" },
                { value: "delivery-time-desc", label: "Slowest Delivery" },
                { value: "distance-asc", label: "Nearest First" },
                { value: "distance-desc", label: "Farthest First" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-5 h-5 text-[#ff6600] focus:ring-[#ff6600] focus:ring-2"
                  />
                  <span className="text-gray-700 font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cuisine Filter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cuisine Type</h3>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => handleCuisineToggle(cuisine)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.cuisines.includes(cuisine)
                      ? "bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Price Range
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: Number(e.target.value) })
                  }
                  className="w-24 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#ff6600] focus:outline-none"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: Number(e.target.value) })
                  }
                  className="w-24 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#ff6600] focus:outline-none"
                  placeholder="Max"
                />
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      priceRange: priceRange.min !== 0 || priceRange.max !== 100
                        ? { min: priceRange.min, max: priceRange.max }
                        : null,
                    })
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    filters.priceRange
                      ? "bg-[#ff6600] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Fee */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Delivery Fee
            </h3>
            <div className="flex gap-3">
              {[
                { value: "free", label: "Free Delivery" },
                { value: "any", label: "Any" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      deliveryFee:
                        filters.deliveryFee === option.value ? null : (option.value as "free" | "any"),
                    })
                  }
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    filters.deliveryFee === option.value
                      ? "bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Minimum Rating
            </h3>
            <div className="flex gap-2">
              {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      minRating: filters.minRating === rating ? null : rating,
                    })
                  }
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filters.minRating === rating
                      ? "bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {rating}+ ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Max Delivery Time */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Maximum Delivery Time
            </h3>
            <div className="flex gap-2 flex-wrap">
              {[15, 30, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      maxDeliveryTime:
                        filters.maxDeliveryTime === minutes ? null : minutes,
                    })
                  }
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filters.maxDeliveryTime === minutes
                      ? "bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={handleClearAll}
            className="px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Apply Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
