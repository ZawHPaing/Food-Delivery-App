import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

export function MapPlaceholder() {
  return (
    <div className="relative h-[300px] w-full rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-inner">
      {/* Fake Map Grid/Pattern */}
      <motion.div 
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        drag
        dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
        style={{
          backgroundImage: `
            radial-gradient(#cbd5e1 1px, transparent 1px),
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px, 100px 100px, 100px 100px',
          width: '200%',
          height: '200%',
          left: '-50%',
          top: '-50%',
        }}
      >
        {/* Fake Map Markers */}
        <div className="absolute top-[40%] left-[45%]">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150" />
            <div className="relative p-2 bg-primary rounded-full shadow-lg border-2 border-white">
              <Navigation className="w-4 h-4 text-white fill-current" />
            </div>
          </div>
        </div>

        <div className="absolute top-[30%] left-[60%]">
          <div className="p-2 bg-white rounded-full shadow-md border border-border">
            <MapPin className="w-4 h-4 text-orange-500" />
          </div>
        </div>

        <div className="absolute top-[60%] left-[30%]">
          <div className="p-2 bg-white rounded-full shadow-md border border-border">
            <MapPin className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      </motion.div>

      {/* Map Overlay Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-white">
          <span className="text-xl font-bold">+</span>
        </button>
        <button className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-white">
          <span className="text-xl font-bold">-</span>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-sm border border-border shadow-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Live GPS tracking active</span>
        </div>
      </div>
    </div>
  );
}
