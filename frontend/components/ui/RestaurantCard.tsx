import Image from "next/image";
import Link from "next/link";
import { RestaurantIcon } from "./CategoryIcons";

interface RestaurantCardProps {
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

export default function RestaurantCard({
  id,
  name,
  cuisine,
  rating,
  deliveryTime,
  deliveryFee,
  image,
  distance,
  isPromoted = false,
}: RestaurantCardProps) {
  return (
    <Link href={`/consumer_module/restaurant/${id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group">
        {/* Image Container */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#e4002b] to-[#ff6600]">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <RestaurantIcon className="w-16 h-16 opacity-80" />
            </div>
          )}
          {isPromoted && (
            <div className="absolute top-2 left-2 bg-[#ff6600] text-white px-3 py-1 rounded-full text-xs font-semibold">
              Promoted
            </div>
          )}
          {distance && (
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
              {distance}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-[#e4002b] transition-colors">
            {name}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{cuisine}</p>

          {/* Rating and Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-[#ff6600] fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700 ml-1">
                  {rating.toFixed(1)}
                </span>
              </div>
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
                {deliveryTime}
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
                {deliveryFee}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
