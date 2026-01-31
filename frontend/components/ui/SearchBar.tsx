"use client";

import { useState } from "react";
import FilterOverlay, { FilterOptions, SortOption } from "./FilterOverlay";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFiltersChange?: (filters: FilterOptions, sortBy: SortOption) => void;
  activeFiltersCount?: number;
  onFocusChange?: (isFocused: boolean) => void;
  isOverlayMode?: boolean;
}

export default function SearchBar({
  placeholder = "Search for restaurants, cuisines, or dishes...",
  onSearch,
  onFiltersChange,
  activeFiltersCount = 0,
  onFocusChange,
  isOverlayMode = false,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    cuisines: [],
    priceRange: null,
    deliveryFee: null,
    minRating: null,
    maxDeliveryTime: null,
  });
  const [currentSort, setCurrentSort] = useState<SortOption>("popularity");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleFiltersApply = (filters: FilterOptions, sortBy: SortOption) => {
    setCurrentFilters(filters);
    setCurrentSort(sortBy);
    onFiltersChange?.(filters, sortBy);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if the new focused element is within the search overlay
    // If not, then allow the blur to close the overlay
    setTimeout(() => {
      const activeElement = document.activeElement;
      const searchOverlay = activeElement?.closest('[data-search-overlay]');
      
      // If the new focused element is not within the search overlay, close it
      if (!searchOverlay && !activeElement?.closest('.search-suggestions')) {
        setIsFocused(false);
        onFocusChange?.(false);
      }
    }, 0);
  };

  // Generate fake suggestions based on search query
  const generateSuggestions = () => {
    if (!searchQuery.trim()) return [];
    
    const fakeSuggestions = [
      `${searchQuery} Restaurant`,
      `${searchQuery} Cuisine`,
      `${searchQuery} Fast Food`,
      `${searchQuery} Delivery`,
      `Best ${searchQuery} Near Me`,
      `${searchQuery} & More`,
      `Popular ${searchQuery}`,
      `${searchQuery} Special`
    ];
    
    return fakeSuggestions.slice(0, 5);
  };

  const totalActiveFilters = activeFiltersCount || 
    currentFilters.cuisines.length +
    (currentFilters.priceRange ? 1 : 0) +
    (currentFilters.deliveryFee ? 1 : 0) +
    (currentFilters.minRating ? 1 : 0) +
    (currentFilters.maxDeliveryTime ? 1 : 0);

  return (
    <>
      <div className="w-full space-y-3">
        {/* Main Search Input */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={`w-full pl-14 py-4 md:py-5 rounded-2xl border-2 border-gray-200 focus:border-[#ff6600] focus:outline-none transition-all duration-200 text-gray-800 placeholder-gray-500 text-base md:text-lg shadow-lg hover:shadow-xl bg-white font-medium ${
                searchQuery ? "pr-48 md:pr-56" : "pr-32 md:pr-36"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-40 md:right-48 flex items-center text-gray-400 hover:text-[#e4002b] transition-colors z-10 pr-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="absolute inset-y-0 right-16 md:right-19 flex items-center z-10 pr-2"
            >
              <div className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white px-4 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold text-sm md:text-base hover:shadow-lg transition-all duration-200 hover:scale-105">
                Search
              </div>
            </button>
            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
            >
              <div className="relative bg-white border-2 border-gray-200 hover:border-[#ff6600] text-gray-700 px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-semibold text-sm md:text-base hover:shadow-lg transition-all duration-200 flex items-center gap-2">
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {/* <span className="hidden md:inline">Filters</span> */}
                {totalActiveFilters > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalActiveFilters}
                  </span>
                )}
              </div>
            </button>
          </div>
        </form>

        {/* Search Suggestions */}
        {isFocused && isOverlayMode && (
          <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden search-suggestions">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Suggestions</h3>
              {generateSuggestions().length > 0 ? (
                <div className="space-y-2">
                  {generateSuggestions().map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        onSearch?.(suggestion);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 group"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-[#ff6600] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <span className="text-gray-700 group-hover:text-gray-900 font-medium">{suggestion}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="w-12 h-12 text-gray-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">Start typing to see suggestions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {totalActiveFilters > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 font-medium">Active filters:</span>
            {currentFilters.cuisines.map((cuisine) => (
              <span
                key={cuisine}
                className="px-3 py-1 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white text-xs font-medium rounded-full flex items-center gap-1"
              >
                {cuisine}
                <button
                  onClick={() => {
                    const newFilters = {
                      ...currentFilters,
                      cuisines: currentFilters.cuisines.filter((c) => c !== cuisine),
                    };
                    handleFiltersApply(newFilters, currentSort);
                  }}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            ))}
            {currentFilters.minRating && (
              <span className="px-3 py-1 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white text-xs font-medium rounded-full flex items-center gap-1">
                {currentFilters.minRating}+ ⭐
                <button
                  onClick={() => {
                    const newFilters = { ...currentFilters, minRating: null };
                    handleFiltersApply(newFilters, currentSort);
                  }}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            )}
            {currentFilters.deliveryFee === "free" && (
              <span className="px-3 py-1 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white text-xs font-medium rounded-full flex items-center gap-1">
                Free Delivery
                <button
                  onClick={() => {
                    const newFilters = { ...currentFilters, deliveryFee: null };
                    handleFiltersApply(newFilters, currentSort);
                  }}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            )}
            {currentSort !== "popularity" && (
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                Sorted: {currentSort.replace("-", " ")}
                <button
                  onClick={() => {
                    setCurrentSort("popularity");
                    handleFiltersApply(currentFilters, "popularity");
                  }}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Overlay */}
      <FilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleFiltersApply}
        initialFilters={currentFilters}
        initialSort={currentSort}
      />
    </>
  );
}
