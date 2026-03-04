export default function HeroBanner() {
  return (
    <div className="relative bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white py-8 md:py-12 pb-16 md:pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            Delicious food delivered to your door
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-4 md:mb-6 opacity-90">
            Order from your favorite restaurants and enjoy fast delivery
          </p>
          <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Fresh Food</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Best Prices</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
