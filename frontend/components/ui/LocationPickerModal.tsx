"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Loader2, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: any) => Promise<void>;
  existingAddress?: any;
}

const MYANMAR_POSTAL_PREFIXES: Record<string, string> = {
  "Yangon": "11",
  "Mandalay": "05",
  "Nay Pyi Taw": "15",
  "Naypyidaw": "15",
  "Bago": "08",
  "Magway": "04",
  "Sagaing": "02",
  "Ayeyarwady": "10",
  "Tanintharyi": "14",
  "Kachin": "01",
  "Kayah": "03",
  "Kayin": "03",
  "Chin": "04",
  "Mon": "12",
  "Rakhine": "07",
  "Shan": "13"
};

export function LocationPickerModal({
  isOpen,
  onClose,
  onSave,
  existingAddress,
}: LocationPickerModalProps) {
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    if (isOpen) {
      setShowForm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (existingAddress) {
      setFormData({
        street: existingAddress.street || "",
        city: existingAddress.city || "",
        state: existingAddress.state || "",
        postal_code: existingAddress.postal_code || "",
        country: existingAddress.country || "",
        latitude: existingAddress.latitude || null,
        longitude: existingAddress.longitude || null,
      });
    }
  }, [existingAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUsePreviousLocation = () => {
    // Just close the modal as requested
    onClose();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({ ...prev, latitude, longitude }));
        setShowForm(true);
        
        // Optional: Reverse geocoding if we had a token and utility
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
          if (token) {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`
            );
            const data = await res.json();
            console.log("[Mapbox] Full response:", data);
            if (data.features && data.features.length > 0) {
              const place = data.features[0];
              const context = place.context || [];
              console.log("[Mapbox] Top feature:", place);
              console.log("[Mapbox] Context:", context);
              
              // Extract base components from the first (most relevant) feature
              const newAddress = {
                street: place.text || "",
                city: context.find((c: any) => c.id.startsWith("place"))?.text || 
                      context.find((c: any) => c.id.startsWith("locality"))?.text || "",
                state: context.find((c: any) => c.id.startsWith("region"))?.text || 
                       context.find((c: any) => c.id.startsWith("district"))?.text || "",
                postal_code: context.find((c: any) => c.id.startsWith("postcode"))?.text || 
                            context.find((c: any) => c.id.startsWith("zipcode"))?.text || 
                            place.properties?.postal_code || "",
                country: context.find((c: any) => c.id.startsWith("country"))?.text || "",
              };

              // EXTENDED SEARCH: If postal_code is still empty, search other features in the response
              if (!newAddress.postal_code) {
                const postcodeFeature = data.features.find((f: any) => 
                  f.place_type?.includes("postcode") || 
                  f.id?.startsWith("postcode")
                );
                if (postcodeFeature) {
                  newAddress.postal_code = postcodeFeature.text;
                } else {
                  // Last resort: check contexts of ALL features for a postcode
                  for (const f of data.features) {
                    const found = f.context?.find((c: any) => c.id.startsWith("postcode"));
                    if (found) {
                      newAddress.postal_code = found.text;
                      break;
                    }
                  }
                }
              }

              // MYANMAR FALLBACK: If country is Myanmar and postal_code is still missing, auto-generate based on State
              if (!newAddress.postal_code && (newAddress.country?.toLowerCase() === "myanmar" || place.place_name?.toLowerCase().includes("myanmar"))) {
                const stateName = newAddress.state || context.find((c: any) => c.id.startsWith("region"))?.text;
                if (stateName) {
                  const prefix = Object.entries(MYANMAR_POSTAL_PREFIXES).find(([key]) => 
                    stateName.toLowerCase().includes(key.toLowerCase())
                  )?.[1];
                  
                  if (prefix) {
                    newAddress.postal_code = `${prefix}011`; // Default to township 011 for the region
                    console.log(`[Mapbox] Applied Myanmar fallback postal code for ${stateName}: ${newAddress.postal_code}`);
                  }
                }
              }
              
              console.log("[Mapbox] Extracted address:", newAddress);
              
              setFormData(prev => ({ ...prev, ...newAddress, latitude, longitude }));
            }
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGeoLoading(false);
        setShowForm(true); // Still show form so they can enter manually
        alert("Unable to retrieve your location. Please enter it manually.");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Failed to save location:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="text-primary w-5 h-5" />
            Set Your Delivery Location
          </DialogTitle>
          <DialogDescription>
            We need your location to show you restaurants that deliver to you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showForm ? (
            <div className="grid gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-14 flex items-center justify-center gap-3 border-2 hover:border-primary hover:text-primary transition-all text-base font-semibold"
                onClick={handleGetCurrentLocation}
                disabled={geoLoading}
              >
                {geoLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
                {geoLoading ? "Fetching location..." : "Use Current Location"}
              </Button>

              {existingAddress && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 flex items-center justify-center gap-3 border-2 hover:border-blue-500 hover:text-blue-500 transition-all text-base font-semibold"
                  onClick={handleUsePreviousLocation}
                >
                  <History className="w-5 h-5" />
                  Use Previous Location
                </Button>
              )}
              
              <p className="text-center text-xs text-muted-foreground mt-2">
                Selecting previous location will use your last saved address.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    name="street"
                    placeholder="123 Main St"
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State / Region</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      placeholder="12345"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="Country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              {formData.latitude && (
                <div className="text-[10px] text-muted-foreground bg-slate-50 p-2 rounded border border-slate-100 italic">
                  GPS Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude?.toFixed(6)}
                </div>
              )}

              <DialogFooter className="mt-6">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="mr-auto">
                  Back
                </Button>
                <Button type="submit" className="flex-1 h-11" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Location
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
