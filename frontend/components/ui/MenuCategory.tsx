"use client";

import { useState } from "react";
import type { Category, MenuItemWithCategory, Restaurant } from "@/types";
import MenuItemCard from "./MenuItemCard";

interface MenuCategoryProps {
  category: Category;
  items: MenuItemWithCategory[];
  restaurant: Pick<Restaurant, "id" | "name" | "image">;
  defaultExpanded?: boolean;
}

export default function MenuCategory({ 
  category, 
  items, 
  restaurant,
  defaultExpanded = true 
}: MenuCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div className="mb-8" id={`category-${category.id}`}>
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#e4002b] transition-colors">
            {category.name}
          </h2>
          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Items Grid */}
      <div
        className={`grid gap-4 transition-all duration-300 ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                restaurant={restaurant}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

