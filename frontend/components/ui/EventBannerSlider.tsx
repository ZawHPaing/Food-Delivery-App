"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface EventBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  discount?: string;
  ctaText?: string;
  link?: string;
}

interface EventBannerSliderProps {
  banners?: EventBanner[];
  autoSlideInterval?: number;
}

const defaultBanners: EventBanner[] = [
  {
    id: "1",
    title: "50% OFF on First Order",
    description: "Use code FIRST50 and get amazing discounts",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop",
    discount: "50% OFF",
    ctaText: "Order Now",
  },
  {
    id: "2",
    title: "Free Delivery Weekend",
    description: "Enjoy free delivery on all orders this weekend",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=400&fit=crop",
    discount: "FREE DELIVERY",
    ctaText: "Shop Now",
  },
  {
    id: "3",
    title: "Limited Time: Buy 2 Get 1 Free",
    description: "Special offer on selected restaurants",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop",
    discount: "BUY 2 GET 1",
    ctaText: "Explore",
  },
];

export default function EventBannerSlider({
  banners = defaultBanners,
  autoSlideInterval = 5000,
}: EventBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [banners.length, autoSlideInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl mb-8">
      {/* Banner Images */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="relative w-full h-full">
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6 md:px-12">
                  <div className="max-w-2xl">
                    {banner.discount && (
                      <div className="inline-block bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white px-4 py-2 rounded-full text-sm md:text-base font-bold mb-4 shadow-lg">
                        {banner.discount}
                      </div>
                    )}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
                      {banner.title}
                    </h2>
                    <p className="text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8">
                      {banner.description}
                    </p>
                    {banner.ctaText && (
                      <button className="bg-white text-[#e4002b] px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-base hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg">
                        {banner.ctaText} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
        aria-label="Previous slide"
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
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
        aria-label="Next slide"
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
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? "w-8 h-3 bg-white"
                : "w-3 h-3 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
