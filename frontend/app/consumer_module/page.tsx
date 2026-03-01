"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import CategoryFilter from "@/components/ui/CategoryFilter";
import RestaurantGrid from "@/components/ui/RestaurantGrid";
import HorizontalScrollSection from "@/components/ui/HorizontalScrollSection";
import EventBannerSlider from "@/components/ui/EventBannerSlider";
import type { FilterOptions, SortOption } from "@/components/ui/FilterOverlay";
import { restaurants as dbRestaurants, menuItemsByRestaurant } from "@/data/restaurants";
import { getRestaurantsFromApi } from "@/lib/discoveryApi";

const transformRestaurant = (r: { id: number; name: string; cuisine_type?: string; average_rating?: number; deliveryTime?: string; deliveryFee?: string; distance?: string; image?: string }, isPromoted = false) => ({
  id: String(r.id),
  name: r.name,
  cuisine: r.cuisine_type ?? "",
  rating: r.average_rating ?? 0,
  deliveryTime: r.deliveryTime ?? "25-35 min",
  deliveryFee: r.deliveryFee ?? "Free",
  distance: r.distance,
  image: r.image,
  isPromoted,
});

// Offers/Promotions data
const offers = [
  {
    id: "1",
    title: "50% OFF First Order",
    description: "New customers get 50% off on their first order",
    discount: "50% OFF",
    code: "FIRST50",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop",
    link: "#",
  },
  {
    id: "2",
    title: "Free Delivery Weekend",
    description: "Enjoy free delivery on all orders this weekend",
    discount: "FREE DELIVERY",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop",
    link: "#",
  },
  {
    id: "3",
    title: "Buy 2 Get 1 Free",
    description: "Special offer on selected restaurants",
    discount: "BUY 2 GET 1",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop",
    link: "#",
  },
  {
    id: "4",
    title: "Weekend Special",
    description: "Get 30% off on weekend orders",
    discount: "30% OFF",
    code: "WEEKEND30",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop",
    link: "#",
  },
];

// Popular Foods from menu items (mock fallback)
const popularFoodsFromMock = Object.entries(menuItemsByRestaurant)
  .flatMap(([restaurantId, items]) =>
    items
      .filter((item) => item.isPopular && item.image)
      .map((item, index) => ({
        id: `f${item.id}`,
        name: item.name,
        description: item.description,
        rating: 4.5 + (index % 5) * 0.1,
        price: `$${(item.price_cents / 100).toFixed(2)}`,
        image: item.image as string,
        link: `/consumer_module/restaurant/${restaurantId}`,
      }))
  )
  .slice(0, 6);

// Vouchers data
const vouchers = [
  {
    id: "v1",
    title: "Free Delivery Voucher",
    description: "Valid for orders above $20",
    discount: "FREE DELIVERY",
    code: "FREEDEL20",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
    link: "#",
  },
  {
    id: "v2",
    title: "$5 Off Voucher",
    description: "Save $5 on your next order",
    discount: "$5 OFF",
    code: "SAVE5",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
    link: "#",
  },
  {
    id: "v3",
    title: "20% Off Voucher",
    description: "Get 20% off on all restaurants",
    discount: "20% OFF",
    code: "SAVE20",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
    link: "#",
  },
];

export default function Home() {
  const [restaurantsList, setRestaurantsList] = useState(dbRestaurants);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    cuisines: [],
    priceRange: null,
    deliveryFee: null,
    minRating: null,
    maxDeliveryTime: null,
  });
  const [sortBy, setSortBy] = useState<SortOption>("popularity");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Searching for:", query);
    // TODO: Implement search functionality with API
  };

  const handleFiltersChange = (filters: FilterOptions, sort: SortOption) => {
    setActiveFilters(filters);
    setSortBy(sort);
    console.log("Filters applied:", filters);
    console.log("Sort by:", sort);
    // TODO: Implement filter and sort functionality with API
  };

  const handleCategorySelect = (categoryId: string) => {
    console.log("Selected category:", categoryId);
    // TODO: Implement category filter
  };

  const handleSearchFocusChange = (isFocused: boolean) => {
    setIsSearchFocused(isFocused);
  };

  const handleCloseOverlay = () => {
    setIsSearchFocused(false);
  };

  useEffect(() => {
    getRestaurantsFromApi().then((apiList) => {
      if (apiList.length > 0) {
        setRestaurantsList(
          apiList.map((r) => ({
            ...r,
            id: r.id,
            name: r.name,
            description: r.description ?? "",
            latitude: 0,
            longitude: 0,
            city: r.city ?? "",
            cuisine_type: r.cuisine_type ?? "",
            average_rating: r.average_rating ?? 0,
            total_reviews: r.total_reviews ?? 0,
            created_at: "",
            deliveryTime: "25-35 min",
            deliveryFee: "Free",
            distance: "",
            isOpen: true,
          }))
        );
      }
    });
  }, []);

  const featuredRestaurants = restaurantsList.slice(0, 4).map((r, i) => transformRestaurant(r, i < 3));
  const popularRestaurants = [...restaurantsList]
    .sort((a, b) => (b.total_reviews ?? 0) - (a.total_reviews ?? 0))
    .map((r) => transformRestaurant(r));
  const newRestaurants = [...restaurantsList]
    .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
    .slice(0, 5)
    .map((r) => ({ ...transformRestaurant(r), badge: "NEW" }));
  const superRestaurants = [...restaurantsList]
    .sort((a, b) => {
      const distA = parseFloat(String(a.distance ?? "").replace(" km", "") || "999");
      const distB = parseFloat(String(b.distance ?? "").replace(" km", "") || "999");
      return distA - distB;
    })
    .slice(0, 5)
    .map((r) => ({ ...transformRestaurant(r), badge: "NEAR", image: r.image }));
  const popularFoods = popularFoodsFromMock;

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
      
      {/* Main Page Content */}
      <main className="py-6">
        {/* Event Banner Slider */}
        <section className="mb-8">
          <div className="container mx-auto px-4">
            <EventBannerSlider />
          </div>
        </section>

        {/* Search Section */}
        <section className="mb-6">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <SearchBar 
                onSearch={handleSearch} 
                onFiltersChange={handleFiltersChange}
                onFocusChange={handleSearchFocusChange}
                isOverlayMode={false}
              />
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="mb-8">
          <CategoryFilter onCategorySelect={handleCategorySelect} />
        </section>
        
        {/* Vouchers Section */}
        <HorizontalScrollSection
          title="Vouchers & Discounts"
          subtitle="Use these codes to save more"
          items={vouchers}
          type="vouchers"
        />

        {/* Popular Orders Section */}
        <HorizontalScrollSection
          title="Popular Orders"
          subtitle="Most ordered foods right now"
          items={popularFoods}
          type="foods"
        />

        {/* Super Restaurants Section */}
        <HorizontalScrollSection
          title="Nearest Restaurants"
          subtitle="Closest picks with great ratings"
          items={superRestaurants}
          type="restaurants"
        />

        {/* Featured Restaurants Grid */}
        <section className="mb-8">
          <div className="container mx-auto px-4">
            <RestaurantGrid
              title="Featured Restaurants"
              restaurants={featuredRestaurants}
              showViewAll={true}
            />
          </div>
        </section>

        {/* Popular Restaurants Grid */}
        <section className="mb-8">
          <div className="container mx-auto px-4">
            <RestaurantGrid
              title="Popular Restaurants"
              restaurants={popularRestaurants}
              showViewAll={true}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Foodie</h3>
              <p className="text-gray-400 text-sm">
                Your favorite food delivery app. Order from the best restaurants
                in town.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Track Order
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 Foodie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
