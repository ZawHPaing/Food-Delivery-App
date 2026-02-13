"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import LoginOverlay from "./LoginOverlay";
import SignupOverlay from "./SignupOverlay";
import CartSidebar from "./CartSidebar";
import { useAuth } from "@/app/_providers/AuthProvider";
import { useCart } from "@/app/_providers/CartProvider";

export default function Header() {
  const [selectedLocation, setSelectedLocation] = useState("Yangon");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showSignupOverlay, setShowSignupOverlay] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const locationRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, user, loginMock, logout } = useAuth();
  const { itemCount, isCartOpen, openCart, closeCart } = useCart();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationRef.current &&
        !locationRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLoginClick = () => {
    setShowProfileDropdown(false);
    setShowLoginOverlay(true);
    setShowSignupOverlay(false);
  };

  const handleSignupClick = () => {
    setShowProfileDropdown(false);
    setShowSignupOverlay(true);
    setShowLoginOverlay(false);
  };

  const handleCloseOverlays = () => {
    setShowLoginOverlay(false);
    setShowSignupOverlay(false);
  };

  const handleSwitchToSignup = () => {
    setShowLoginOverlay(false);
    setShowSignupOverlay(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupOverlay(false);
    setShowLoginOverlay(true);
  };

  const handleLoginSuccess = () => {
    loginMock();
    handleCloseOverlays();
    setShowProfileDropdown(true);
  };

  const handleFavoriteClick = () => {
    // Toggle favorite state for demo purposes
    setFavorites(prev => 
      prev.includes("demo-item") 
        ? prev.filter(item => item !== "demo-item")
        : [...prev, "demo-item"]
    );
  };

  const handleCartClick = () => {
    openCart();
  };

  const locations = ["Yangon", "Mandalay", "Naypyidaw", "Bago", "Mawlamyine"];
  const languages = ["EN", "MY", "TH", "CN"];

  const displayName = user?.username ?? "user";

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/consumer_module" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#e4002b] to-[#ff6600] flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold text-[#e4002b]">Foodie</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/consumer_module" 
              className="text-gray-700 hover:text-[#e4002b] transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              href="/consumer_module/restaurants" 
              className="text-gray-700 hover:text-[#e4002b] transition-colors font-medium"
            >
              Restaurants
            </Link>
          </nav>

          {/* Location Selector - Center */}
          <div
            ref={locationRef}
            className="hidden md:flex items-center space-x-2 relative"
          >
            <svg
              className="w-5 h-5 text-gray-600"
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
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center space-x-1 text-gray-700 hover:text-[#e4002b] transition-colors font-medium"
            >
              <span>Location {selectedLocation}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showLocationDropdown && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-50">
                {locations.map((location) => (
                  <button
                    key={location}
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowLocationDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side actions - No Login State */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {!isLoggedIn ? (
              <>
                {/* Login Button */}
                <button
                  onClick={handleLoginClick}
                  className="border-2 border-gray-300 px-4 py-2 rounded-lg font-semibold text-gray-700 hover:border-[#e4002b] hover:text-[#e4002b] transition-colors text-sm md:text-base"
                >
                  Log in
                </button>

                {/* Sign Up Button */}
                <button
                  onClick={handleSignupClick}
                  className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm md:text-base whitespace-nowrap"
                >
                  Sign up for free delivery
                </button>
              </>
            ) : (
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 text-gray-800 hover:text-[#e4002b] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 2a10 10 0 100 20 10 10 0 000-20z"
                    />
                  </svg>
                  <span className="font-semibold">{displayName}</span>
                  <svg className="w-4 h-4 text-[#e4002b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showProfileDropdown ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>

                {showProfileDropdown && (
                  <div className="absolute top-full mt-3 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 min-w-[280px] z-50 overflow-hidden">
                    <div className="py-2">
                      <button className="w-full px-4 py-3 flex items-center space-x-3 text-gray-800 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Orders & reordering</span>
                      </button>

                      <Link
                        href="/consumer_module/profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full px-4 py-3 flex items-center space-x-3 text-gray-800 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                        </svg>
                        <span className="font-medium">Profile</span>
                      </Link>

                      <button className="w-full px-4 py-3 flex items-center space-x-3 text-gray-800 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a3 3 0 016 0v2H9V5z" />
                        </svg>
                        <span className="font-medium">Vouchers</span>
                      </button>

                      <button className="w-full px-4 py-3 flex items-center space-x-3 text-gray-800 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1 1 0 00.95.69h.02c.97 0 1.371 1.24.588 1.81a1 1 0 00-.364 1.118l.007.02c.3.921-.755 1.688-1.54 1.118a1 1 0 00-1.175 0c-.784.57-1.838-.197-1.539-1.118l.007-.02a1 1 0 00-.364-1.118c-.783-.57-.382-1.81.588-1.81h.02a1 1 0 00.95-.69z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10.5v10m-4-2h8" />
                        </svg>
                        <span className="font-medium">Rewards</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-200 my-1" />

                    <div className="py-2">
                      <button className="w-full px-4 py-3 flex items-center space-x-3 text-gray-800 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.19 10.19 0 01-4-.8L3 20l1.2-3.6A7.34 7.34 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-medium">Help Center</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-3 flex items-center space-x-3 text-gray-800 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H9" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20a2 2 0 01-2-2V6a2 2 0 012-2h4" />
                        </svg>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language Selector */}
            <div
              ref={languageRef}
              className="hidden md:flex items-center space-x-1 relative"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center space-x-1 text-gray-700 hover:text-[#e4002b] transition-colors font-medium"
              >
                <span>{selectedLanguage}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showLanguageDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[100px] z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setShowLanguageDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Icon */}
            <button 
              onClick={handleCartClick}
              className="relative p-2 text-gray-700 hover:text-[#e4002b] transition-colors"
            >
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
              <span className="absolute top-0 right-0 h-5 w-5 bg-[#ff6600] text-white text-xs rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            </button>

            {/* Favorite Button - Only show when logged in */}
            {isLoggedIn && (
              <button 
                onClick={handleFavoriteClick}
                className={`relative p-2 transition-colors ${
                  favorites.includes("demo-item") 
                    ? "text-[#e4002b]" 
                    : "text-gray-700 hover:text-[#e4002b]"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${favorites.includes("demo-item") ? "fill-current" : ""}`}
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
                <span className="absolute top-0 right-0 h-5 w-5 bg-[#e4002b] text-white text-xs rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overlays */}
      <LoginOverlay
        isOpen={showLoginOverlay}
        onClose={handleCloseOverlays}
        onSwitchToSignup={handleSwitchToSignup}
        onLoginSuccess={handleLoginSuccess}
      />
      <SignupOverlay
        isOpen={showSignupOverlay}
        onClose={handleCloseOverlays}
        onSwitchToLogin={handleSwitchToLogin}
        onLoginSuccess={handleLoginSuccess}
      />
      <CartSidebar 
        isOpen={isCartOpen}
        onClose={closeCart}
      />
    </header>
  );
}
