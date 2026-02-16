import RestaurantCard from "./RestaurantCard";

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
}

interface RestaurantGridProps {
  title: string;
  restaurants: Restaurant[];
  showViewAll?: boolean;
}

export default function RestaurantGrid({
  title,
  restaurants,
  showViewAll = false,
}: RestaurantGridProps) {
  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {showViewAll && (
            <button className="text-[#e4002b] font-semibold hover:text-[#ff6600] transition-colors">
              View All →
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} {...restaurant} />
          ))}
        </div>
      </div>
    </section>
  );
}
