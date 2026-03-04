"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Navigation, Bike, Store, User } from 'lucide-react'; // Added icons
import { useAuth } from '@/app/_providers/AuthProvider';
import { renderToStaticMarkup } from 'react-dom/server'; // To convert Lucide icons to HTML strings

interface RiderUser {
  rider?: {
    id: string | number;
  };
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapPlaceholderProps {
  riderLocation?: { latitude: number; longitude: number } | null;
  destinationCoords?: { latitude: number; longitude: number } | null;
  destinationType?: 'shop' | 'customer' | null;
  startCoords?: { latitude: number; longitude: number } | null;
}

export function MapPlaceholder({ riderLocation, destinationCoords, destinationType, startCoords }: MapPlaceholderProps) {
  const { user } = useAuth();
  const riderId = (user as RiderUser)?.rider?.id;

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [initialCenter, setInitialCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationSource, setLocationSource] = useState<"db" | "geo" | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null);
  
  // Get vehicle type from Auth
  const vehicleType = (user as any)?.rider?.vehicle_type?.toLowerCase() || 'car';
  const routingProfile = (['bike', 'bicycle', 'motorbike', 'scooter'].includes(vehicleType)) 
    ? 'cycling' 
    : 'driving';

  const [dbChecked, setDbChecked] = useState(false);
  const YANGON_COORDS: [number, number] = [96.1561, 16.8661];

  // --- HELPER: Create Custom Marker Element ---
  const createMarkerElement = (type: 'rider' | 'shop' | 'customer') => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    // Style the marker container
    Object.assign(el.style, {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '3px solid white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      backgroundColor: type === 'rider' ? '#e4002b' : type === 'shop' ? '#F59E0B' : '#3B82F6',
      color: 'white',
      cursor: 'pointer',
    });

    // Pick icon based on type
    const Icon = type === 'rider' 
      ? (['bike', 'bicycle', 'motorbike', 'scooter'].includes(vehicleType) ? Bike : Navigation)
      : type === 'shop' ? Store : User;
    el.innerHTML = renderToStaticMarkup(<Icon size={20} />);
    
    return el;
  };

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter
        ? [initialCenter.longitude, initialCenter.latitude]
        : riderLocation
        ? [riderLocation.longitude, riderLocation.latitude]
        : YANGON_COORDS,
      zoom: 13,
      attributionControl: false,
    });

    if (dbChecked && !initialCenter && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { longitude: position.coords.longitude, latitude: position.coords.latitude };
          setUserLocation(coords);
          setLocationSource("geo");
          map.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14 });
        },
        () => map.current?.flyTo({ center: YANGON_COORDS, zoom: 12 }),
        { enableHighAccuracy: true }
      );
    }
  }, [initialCenter, riderLocation, dbChecked]);

  useEffect(() => {
    if (riderLocation) setUserLocation(riderLocation);
  }, [riderLocation]);

  useEffect(() => {
    if (!riderId) return;
    const token = localStorage.getItem('access_token');
    fetch(`http://localhost:8000/delivery/location?rider_id=${Number(riderId)}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const coords = { latitude: data.latitude, longitude: data.longitude };
          setInitialCenter(coords);
          setUserLocation(coords);
          setLocationSource("db");
        }
      })
      .catch(() => {})
      .finally(() => {
        setDbChecked(true);
      });
  }, [riderId]);

  // Handle Destination & Route
  useEffect(() => {
    if (!map.current || !destinationCoords || !userLocation) return;

    const origin = startCoords || userLocation;
    
    // Create custom destination marker (persistent)
    const markerEl = createMarkerElement(destinationType || 'customer');
    new mapboxgl.Marker(markerEl)
      .setLngLat([destinationCoords.longitude, destinationCoords.latitude])
      .addTo(map.current);

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([origin.longitude, origin.latitude]);
    bounds.extend([destinationCoords.longitude, destinationCoords.latitude]);
    map.current.fitBounds(bounds, { padding: 80 });

    const getRoute = async () => {
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${routingProfile}/${origin.longitude},${origin.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const data = await query.json();
        if (!data.routes?.[0]) return;
        
        const route = data.routes[0];
        
        // Update route info overlay
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.ceil(route.duration / 60);
        setRouteInfo({ distance: `${distKm} km`, duration: `${durMin} min` });

        const routeId = `route-${Date.now()}`;
        if (map.current) {
          map.current.addSource(routeId, {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: route.geometry }
          });
          map.current.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#e4002b', 'line-width': 5, 'line-opacity': 0.8 }
          });
        }
      } catch (err) {
        console.error("[MapPlaceholder] Error fetching route:", err);
      }
    };
    getRoute();
  }, [destinationCoords, destinationType, routingProfile, userLocation, startCoords]);

  // Handle Rider Marker (Singleton - moves with location)
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarker.current) {
      userMarker.current.setLngLat([userLocation.longitude, userLocation.latitude]);
    } else {
      const el = createMarkerElement('rider');
      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);
    }
  }, [userLocation, createMarkerElement]);

  useEffect(() => {
    if (userLocation && riderId && locationSource === "geo") {
      const token = localStorage.getItem('access_token');
      fetch('http://localhost:8000/delivery/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ rider_id: Number(riderId), ...userLocation }),
      }).catch(() => {});
    }
  }, [userLocation, riderId, locationSource]);

  return (
    <div className="relative h-100 w-full rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-slate-100">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Route Info Overlay */}
      {routeInfo && (
        <div className="absolute top-4 left-4 z-10 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="bg-white/95 backdrop-blur px-4 py-2.5 rounded-2xl shadow-xl border border-white flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Distance</span>
              <span className="text-sm font-black text-slate-900 leading-none">{routeInfo.distance}</span>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Duration</span>
              <span className="text-sm font-black text-primary leading-none">{routeInfo.duration}</span>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="p-1.5 bg-primary/10 rounded-lg">
              {routingProfile === 'cycling' ? <Bike className="w-4 h-4 text-primary" /> : <Navigation className="w-4 h-4 text-primary" />}
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button onClick={() => map.current?.zoomIn()} className="w-10 h-10 rounded-xl bg-white/90 shadow-sm flex items-center justify-center font-bold hover:bg-white">+</button>
        <button onClick={() => map.current?.zoomOut()} className="w-10 h-10 rounded-xl bg-white/90 shadow-sm flex items-center justify-center font-bold hover:bg-white">-</button>
        <button onClick={() => userLocation && map.current?.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 15 })} className="w-10 h-10 rounded-xl bg-white/90 shadow-sm flex items-center justify-center hover:bg-white"><Navigation size={20} /></button>
      </div>
    </div>
  );
}
