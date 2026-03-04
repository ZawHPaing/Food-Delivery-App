"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RestaurantIcon } from "./CategoryIcons";

type VoucherTheme = {
  outerGradient: string;
  stripBg: string;
  accentText: string;
  divider: string;
};

const voucherThemes: VoucherTheme[] = [
  {
    outerGradient: "bg-gradient-to-r from-[#FFE27A] to-[#FFF2B8]",
    stripBg: "bg-[#FFD84D]",
    accentText: "text-[#7C2D12]",
    divider: "border-black/20",
  },
  {
    outerGradient: "bg-gradient-to-r from-[#FFA7B6] to-[#FFD0D8]",
    stripBg: "bg-[#FF8DA2]",
    accentText: "text-[#7F1D1D]",
    divider: "border-black/20",
  },
  {
    outerGradient: "bg-gradient-to-r from-[#D9B8FF] to-[#F0DFFF]",
    stripBg: "bg-[#C084FC]",
    accentText: "text-[#3B0764]",
    divider: "border-black/20",
  },
];

function getVoucherTheme(index: number): VoucherTheme {
  return voucherThemes[index % voucherThemes.length];
}

interface OfferCard {
  id: string;
  title: string;
  description: string;
  discount: string;
  image: string;
  code?: string;
  link?: string;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  image?: string;
  distance?: string;
  isPromoted?: boolean;
  badge?: string;
}

interface FoodItem {
  id: string;
  name: string;
  description?: string;
  rating: number;
  price?: string;
  image: string;
  link?: string;
}

interface HorizontalScrollSectionProps {
  title: string;
  subtitle?: string;
  items: (OfferCard | Restaurant | FoodItem)[];
  type: "offers" | "restaurants" | "vouchers" | "foods";
  showViewAll?: boolean;
}

export default function HorizontalScrollSection({
  title,
  subtitle,
  items,
  type,
  showViewAll = true,
}: HorizontalScrollSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h2>
            {subtitle && (
              <p className="text-gray-600 text-sm md:text-base mt-1">{subtitle}</p>
            )}
          </div>
          {showViewAll && (
            <button className="text-[#e4002b] font-semibold hover:text-[#ff6600] transition-colors text-sm md:text-base">
              View All →
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all hidden md:block"
            aria-label="Scroll left"
          >
            <svg
              className="w-6 h-6 text-gray-700"
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
          </button>

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {type === "offers" ? (
              (items as OfferCard[]).map((item) => (
                <Link
                  key={item.id}
                  href={item.link || "#"}
                  className="flex-shrink-0 w-80 md:w-96"
                >
                  <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 320px, 384px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white px-4 py-2 rounded-full text-sm font-bold inline-block w-fit">
                        {item.discount}
                      </div>
                      <div>
                        <h3 className="text-white text-xl md:text-2xl font-bold mb-2">
                          {item.title}
                        </h3>
                        <p className="text-white/90 text-sm md:text-base mb-3">
                          {item.description}
                        </p>
                        {item.code && (
                          <div className="flex items-center space-x-2">
                            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-mono">
                              {item.code}
                            </span>
                            <CopyCodeButton code={item.code} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : type === "vouchers" ? (
              (items as OfferCard[]).map((item, index) => {
                const theme = getVoucherTheme(index);
                return (
                  <Link
                    key={item.id}
                    href={item.link || "#"}
                    className="flex-shrink-0 w-[340px] md:w-[440px]"
                  >
                    <div
                      className={`relative h-40 md:h-44 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${theme.outerGradient}`}
                    >
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute -top-8 -left-8 w-28 h-28 bg-white rounded-full" />
                        <div className="absolute -bottom-10 left-20 w-36 h-36 bg-white rounded-full" />
                        <div className="absolute top-6 right-24 w-16 h-16 bg-white rounded-full" />
                      </div>

                      <div className="relative h-full flex">
                        <div
                          className={`relative w-20 md:w-24 shrink-0 ${theme.stripBg} flex flex-col items-center justify-center border-r border-dashed ${theme.divider}`}
                        >
                          <div
                            className={`text-xs font-extrabold tracking-widest uppercase ${theme.accentText}`}
                            style={{ writingMode: "vertical-rl" }}
                          >
                            Coupon
                          </div>
                          <div className={`mt-2 text-xs font-black ${theme.accentText}`}>
                            {item.discount}
                          </div>
                          <div className="mt-3 flex flex-col space-y-1">
                            <div className="w-9 h-[2px] bg-black/25" />
                            <div className="w-9 h-[2px] bg-black/25" />
                            <div className="w-9 h-[2px] bg-black/25" />
                            <div className="w-9 h-[2px] bg-black/25" />
                          </div>

                          <div className="absolute top-6 -right-2 w-4 h-4 bg-[#f8f9fa] rounded-full" />
                          <div className="absolute bottom-6 -right-2 w-4 h-4 bg-[#f8f9fa] rounded-full" />
                        </div>

                        <div className="relative flex-1 px-4 md:px-5 py-3 md:py-4">
                          <div className="pr-24 md:pr-28">
                            <div className={`text-lg md:text-xl font-black leading-tight ${theme.accentText}`}>
                              {item.title}
                            </div>
                            <div className={`text-sm md:text-base font-bold ${theme.accentText}`}>
                              {item.discount}
                            </div>
                            <div className="text-xs md:text-sm text-black/70 mt-1 line-clamp-2">
                              {item.description}
                            </div>

                            {item.code && (
                              <div className="mt-3 flex items-center space-x-2">
                                <span className="bg-white/70 backdrop-blur-sm text-black px-3 py-1.5 rounded-lg text-xs md:text-sm font-mono border border-black/10">
                                  {item.code}
                                </span>
                                <CopyCodeButton code={item.code} />
                              </div>
                            )}
                          </div>

                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 80px, 96px"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : type === "foods" ? (
              (items as FoodItem[]).map((food) => (
                <Link
                  key={food.id}
                  href={food.link || "#"}
                  className="flex-shrink-0 w-64 md:w-72"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <div className="relative h-40 md:h-44 w-full overflow-hidden bg-gray-100">
                      <Image
                        src={food.image}
                        alt={food.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 256px, 288px"
                      />
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-[#e4002b] transition-colors line-clamp-1">
                          {food.name}
                        </h3>
                        {food.price && (
                          <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                            {food.price}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          <svg
                            className="w-4 h-4 text-[#ff6600] fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">
                            {food.rating.toFixed(1)}
                          </span>
                        </div>

                        <span className="text-xs text-gray-500">Popular</span>
                      </div>

                      {food.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {food.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              (items as Restaurant[]).map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurant/${restaurant.id}`}
                  className="flex-shrink-0 w-64 md:w-72"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    {/* Image Container */}
                    <div className="relative h-40 md:h-48 w-full overflow-hidden bg-gradient-to-br from-[#e4002b] to-[#ff6600]">
                      {restaurant.image ? (
                        <Image
                          src={restaurant.image}
                          alt={restaurant.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 256px, 288px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <RestaurantIcon className="w-16 h-16 opacity-80" />
                        </div>
                      )}
                      {restaurant.badge && (
                        <div className="absolute top-2 left-2 bg-[#ff6600] text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {restaurant.badge}
                        </div>
                      )}
                      {restaurant.distance && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                          {restaurant.distance}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-[#e4002b] transition-colors line-clamp-1">
                        {restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                        {restaurant.cuisine}
                      </p>

                      {/* Rating and Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <svg
                            className="w-4 h-4 text-[#ff6600] fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-700">
                            {restaurant.rating.toFixed(1)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
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
                            {restaurant.deliveryTime}
                          </span>
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
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
                            {restaurant.deliveryFee}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all hidden md:block"
            aria-label="Scroll right"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

// Copy Code Button Component
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const doCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        const el = document.createElement("textarea");
        el.value = code;
        el.style.position = "fixed";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    void doCopy();
  };

  return (
    <button
      onClick={handleCopy}
      className="bg-white text-[#e4002b] px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap border border-black/10"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
