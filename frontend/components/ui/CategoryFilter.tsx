"use client";

import { useState } from "react";
import {
  AllIcon,
  FastFoodIcon,
  PizzaIcon,
  AsianIcon,
  DessertsIcon,
  BeveragesIcon,
  HealthyIcon,
  SeafoodIcon,
} from "./CategoryIcons";

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryFilterProps {
  categories?: Category[];
  onCategorySelect?: (categoryId: string) => void;
}

const defaultCategories: Category[] = [
  { id: "all", name: "All", icon: AllIcon },
  { id: "fast-food", name: "Fast Food", icon: FastFoodIcon },
  { id: "pizza", name: "Pizza", icon: PizzaIcon },
  { id: "asian", name: "Asian", icon: AsianIcon },
  { id: "desserts", name: "Desserts", icon: DessertsIcon },
  { id: "beverages", name: "Beverages", icon: BeveragesIcon },
  { id: "healthy", name: "Healthy", icon: HealthyIcon },
  { id: "seafood", name: "Seafood", icon: SeafoodIcon },
];

export default function CategoryFilter({
  categories = defaultCategories,
  onCategorySelect,
}: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategorySelect?.(categoryId);
  };

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="container mx-auto px-4">
        <div className="flex space-x-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex flex-col items-center space-y-2 px-6 py-3 rounded-2xl transition-all whitespace-nowrap min-w-[100px] ${
                selectedCategory === category.id
                  ? "bg-gradient-to-br from-[#e4002b] to-[#ff6600] text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <category.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
