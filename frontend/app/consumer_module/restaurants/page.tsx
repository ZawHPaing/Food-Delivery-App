"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { restaurants as dbRestaurants } from "@/data/restaurants";
import SearchBar from "@/components/ui/SearchBar";
import type { FilterOptions, SortOption } from "@/components/ui/FilterOverlay";

type QuickFilterOption = "all" | "fast-food" | "pizza" | "asian" | "coffee" | "mexican";

export default function RestaurantsPage() {
  const [sortBy, setSortBy] = useState<SortOption>("rating"); // "rating" matches existing default, but needs to be compatible with SortOption type
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    cuisines: [],
    priceRange: null,
    deliveryFee: null,
    minRating: null,
    maxDeliveryTime: null,
  });
  const [quickFilter, setQuickFilter] = useState<QuickFilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearchFocused(false);
  };

  const handleFiltersChange = (filters: FilterOptions, sort: SortOption) => {
    setActiveFilters(filters);
    setSortBy(sort);
    // Reset quick filter if cuisines are changed manually
    if (filters.cuisines.length > 0) {
      setQuickFilter("all");
    }
    setIsSearchFocused(false);
  };

  const handleSearchFocusChange = (isFocused: boolean) => {
    setIsSearchFocused(isFocused);
  };

  const handleCloseOverlay = () => {
    setIsSearchFocused(false);
  };

  const handleQuickFilterClick = (id: QuickFilterOption, label: string) => {
    setQuickFilter(id);
    if (id === "all") {
      setActiveFilters(prev => ({ ...prev, cuisines: [] }));
    } else {
      // Map quick filter to cuisine name
      const cuisineMap: Record<string, string> = {
        "fast-food": "Fast Food",
        "pizza": "Pizza",
        "asian": "Asian",
        "coffee": "Coffee",
        "mexican": "Mexican"
      };
      const cuisine = cuisineMap[id] || label;
      setActiveFilters(prev => ({ ...prev, cuisines: [cuisine] }));
    }
  };

  // Filter restaurants
  const filteredRestaurants = dbRestaurants.filter((restaurant) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !restaurant.name.toLowerCase().includes(query) &&
        !restaurant.cuisine_type.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Active Filters (merged logic)
    // Cuisines
    if (activeFilters.cuisines.length > 0) {
      const restaurantCuisines = restaurant.cuisine_type.split(",").map(c => c.trim().toLowerCase());
      const hasMatch = activeFilters.cuisines.some(c => {
        const filterCuisine = c.toLowerCase();
        
        // Handle synonyms and grouping
        if (filterCuisine === "asian") {
          return restaurantCuisines.some(rc => 
            rc.includes("asian") || 
            rc.includes("chinese") || 
            rc.includes("japanese") || 
            rc.includes("sushi") ||
            rc.includes("thai") ||
            rc.includes("vietnamese") ||
            rc.includes("korean")
          );
        }
        
        if (filterCuisine === "beverages" || filterCuisine === "coffee") {
          return restaurantCuisines.some(rc => 
            rc.includes("beverages") || 
            rc.includes("coffee") || 
            rc.includes("tea") ||
            rc.includes("juice")
          );
        }
        
        if (filterCuisine === "pizza") {
          return restaurantCuisines.some(rc => 
            rc.includes("pizza") || 
            rc.includes("italian")
          );
        }
        
        if (filterCuisine === "fast food") {
          return restaurantCuisines.some(rc => 
            rc.includes("fast food") || 
            rc.includes("burgers") ||
            rc.includes("fries")
          );
        }

        return restaurantCuisines.some(rc => rc.includes(filterCuisine));
      });
      if (!hasMatch) return false;
    }

    // Delivery Fee
    if (activeFilters.deliveryFee === "free") {
      if (restaurant.deliveryFee !== "Free") return false;
    }

    // Min Rating
    if (activeFilters.minRating) {
      if (restaurant.average_rating < activeFilters.minRating) return false;
    }

    // Max Delivery Time
    if (activeFilters.maxDeliveryTime) {
      // Parse "25-35 min" -> 35
      const timeMatch = restaurant.deliveryTime.match(/(\d+)-(\d+)/);
      const maxTime = timeMatch ? parseInt(timeMatch[2]) : parseInt(restaurant.deliveryTime);
      if (maxTime > activeFilters.maxDeliveryTime) return false;
    }

    return true;
  });

  // Sort restaurants
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    switch (sortBy) {
      case "rating": // Map "rating" to rating-desc if needed, or handle both
      case "rating-desc":
        return b.average_rating - a.average_rating;
      case "rating-asc":
        return a.average_rating - b.average_rating;
      case "distance":
      case "distance-asc":
        const distA = parseFloat(a.distance?.replace(" km", "") || "999");
        const distB = parseFloat(b.distance?.replace(" km", "") || "999");
        return distA - distB;
      case "distance-desc":
        const distADesc = parseFloat(a.distance?.replace(" km", "") || "0");
        const distBDesc = parseFloat(b.distance?.replace(" km", "") || "0");
        return distBDesc - distADesc;
      case "name":
        return a.name.localeCompare(b.name);
      case "reviews": // Not in SortOption but was in original code
      case "popularity":
        return b.total_reviews - a.total_reviews;
      case "delivery-time-asc":
        const timeA = parseInt(a.deliveryTime);
        const timeB = parseInt(b.deliveryTime);
        return timeA - timeB;
      case "delivery-time-desc":
        const timeADesc = parseInt(a.deliveryTime);
        const timeBDesc = parseInt(b.deliveryTime);
        return timeBDesc - timeADesc;
      default:
        return 0;
    }
  });

  const filters: { id: QuickFilterOption; label: string; icon: string }[] = [
    { id: "all", label: "All", icon: "🍽️" },
    { id: "fast-food", label: "Fast Food", icon: "🍔" },
    { id: "pizza", label: "Pizza", icon: "🍕" },
    { id: "asian", label: "Asian", icon: "🍜" },
    { id: "coffee", label: "Coffee", icon: "☕" },
    { id: "mexican", label: "Mexican", icon: "🌮" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Full Page Search Overlay */}
      {isSearchFocused && (
        <div className="fixed inset-0 z-50 bg-white" data-search-overlay="true">
          {/* Close Button */}
          <button
            onClick={handleCloseOverlay}
            className="absolute top-6 right-6 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close search"
          >
            <svg
              className="w-6 h-6 text-gray-600 hover:text-gray-900"
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
          
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-5xl mx-auto">
              <SearchBar 
                onSearch={handleSearch} 
                onFiltersChange={handleFiltersChange}
                onFocusChange={handleSearchFocusChange}
                isOverlayMode={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#e4002b] to-[#ff6600] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">All Restaurants</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Discover the best restaurants in your area. From fast food to fine dining,
            we have something for everyone.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-[600px] xl:w-[700px]">
              <SearchBar 
                onSearch={handleSearch} 
                onFiltersChange={handleFiltersChange}
                onFocusChange={handleSearchFocusChange}
                isOverlayMode={false}
              />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleQuickFilterClick(filter.id, filter.label)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    quickFilter === filter.id
                      ? "bg-[#e4002b] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e4002b]/20 focus:border-[#e4002b] text-sm"
              >
                <option value="popularity">Popularity</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="distance">Nearest</option>
                <option value="reviews">Most Reviews</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="container mx-auto px-4 py-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-gray-900">{sortedRestaurants.length}</span>{" "}
          restaurants
          {activeFilters.cuisines.length > 0 && (
            <span>
              {" "}
              in <span className="font-semibold text-[#e4002b]">{activeFilters.cuisines.join(", ")}</span>
            </span>
          )}
        </p>
      </div>

      {/* Restaurants Grid */}
      <div className="container mx-auto px-4 pb-12">
        {sortedRestaurants.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedRestaurants.map((restaurant) => (
              <Link key={restaurant.id} href={`/consumer_module/restaurant/${restaurant.id}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group h-full">
                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#e4002b] to-[#ff6600]">
                    {restaurant.image ? (
                      <Image
                        src={restaurant.image}
                        alt={restaurant.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <span className="text-6xl">🍽️</span>
                      </div>
                    )}
                    {restaurant.isOpen && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Open
                      </div>
                    )}
                    {restaurant.distance && (
                      <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                        {restaurant.distance}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-[#e4002b] transition-colors">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{restaurant.cuisine_type}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-[#ff6600] fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700">
                          {restaurant.average_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({restaurant.total_reviews.toLocaleString()})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {restaurant.deliveryTime}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Fee */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className={`text-sm font-medium ${restaurant.deliveryFee === "Free" ? "text-green-600" : "text-gray-600"}`}>
                        {restaurant.deliveryFee === "Free" ? "🎉 Free Delivery" : `Delivery: ${restaurant.deliveryFee}`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

