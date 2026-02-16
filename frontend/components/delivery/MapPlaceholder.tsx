"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Navigation } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';

// 1. Define the User/Rider structure based on your Auth provider
interface RiderUser {
  rider?: {
    id: string | number;
  };
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export function MapPlaceholder() {
  const { user } = useAuth();
  // Cast user safely or use the interface
  const riderId = (user as RiderUser)?.rider?.id;

  // 2. Type the Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  // 3. Type the State
  const [zoom, setZoom] = useState<number>(8);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const YANGON_COORDS: [number, number] = [96.1561, 16.8661];

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: YANGON_COORDS,
      zoom: zoom,
      attributionControl: false,
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const coords: [number, number] = [longitude, latitude];
          
          setUserLocation(coords);
          map.current?.flyTo({ center: coords, zoom: 14, essential: true });
        },
        (error) => {
          console.error('Error getting user location:', error);
          map.current?.flyTo({ center: YANGON_COORDS, zoom: 12 });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    map.current.on('zoom', () => {
      if (map.current) {
        setZoom(Number(map.current.getZoom().toFixed(2)));
      }
    });
  }, []);

  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarker.current) {
      userMarker.current.remove();
    }

    userMarker.current = new mapboxgl.Marker({ color: '#FF0000' })
      .setLngLat(userLocation)
      .addTo(map.current);
  }, [userLocation]);

  useEffect(() => {
    if (userLocation && riderId) {
      const [longitude, latitude] = userLocation;
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      fetch('http://localhost:8000/delivery/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rider_id: riderId,
          current_latitude: latitude,
          current_longitude: longitude,
        }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error('Failed to update rider location');
          return response.json();
        })
        .then(data => console.log('Rider location updated:', data))
        .catch(error => console.error('Error updating rider location:', error));
    }
  }, [userLocation, riderId]);

  const zoomIn = () => map.current?.zoomIn();
  const zoomOut = () => map.current?.zoomOut();

  return (
    <div className="relative h-100 w-full rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-slate-100">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button onClick={zoomIn} className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm flex items-center justify-center text-slate-800 hover:bg-white active:scale-95 transition-transform">
          <span className="text-xl font-bold">+</span>
        </button>
        <button onClick={zoomOut} className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm flex items-center justify-center text-slate-800 hover:bg-white active:scale-95 transition-transform">
          <span className="text-xl font-bold">-</span>
        </button>
        {userLocation && (
          <button
            onClick={() => map.current?.flyTo({ center: userLocation, zoom: 14, essential: true })}
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm flex items-center justify-center text-slate-800 hover:bg-white active:scale-95 transition-transform"
          >
            <Navigation size={20} />
          </button>
        )}
      </div>

      <div className="absolute bottom-1 left-1 right-4 z-10">
        <div className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm flex items-center gap-2 w-fit">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-600">Mapbox Live active</span>
        </div>
      </div>
    </div>
  );
}