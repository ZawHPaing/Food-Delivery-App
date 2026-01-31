"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/_providers/AuthProvider";

export default function ProfilePage() {
  const { isLoggedIn, user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
    if (!user) return;
    setFullName(user.fullName ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    
    // Simple parsing of address string
    const parts = (user.address ?? "").split(",").map(p => p.trim());
    if (parts.length >= 4) {
      setStreet(parts[0]);
      setApartment(parts[1]);
      setCity(parts[2]);
      setZipCode(parts[3]);
    } else if (parts.length === 3) {
      setStreet(parts[0]);
      setApartment("");
      setCity(parts[1]);
      setZipCode(parts[2]);
    } else {
      setStreet(user.address ?? "");
      setApartment("");
      setCity("");
      setZipCode("");
    }
  }, [user]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">You need to log in to edit your profile.</p>
            <Link href="/" className="inline-block mt-6 text-[#e4002b] font-semibold hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <Link href="/" className="text-sm text-gray-600 hover:text-[#e4002b] transition-colors">
              Back
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                id="username"
                value={user?.username ?? ""}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                placeholder="+959..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="md:col-span-2">
                  <label htmlFor="street" className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
                  <input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors bg-white"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label htmlFor="apartment" className="block text-xs font-medium text-gray-600 mb-1">Apartment / Suite (Optional)</label>
                  <input
                    id="apartment"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors bg-white"
                    placeholder="Apt 4B"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors bg-white"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="block text-xs font-medium text-gray-600 mb-1">Zip Code</label>
                  <input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors bg-white"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm">
              {saved ? <span className="text-green-600 font-semibold">Saved</span> : <span className="text-gray-500"> </span>}
            </div>
            <button
              onClick={() => {
                const addressString = [street, apartment, city, zipCode]
                  .map(p => p.trim())
                  .filter(p => p !== "")
                  .join(", ");
                updateProfile({ fullName, email, phone, address: addressString });
                setSaved(true);
              }}
              className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white px-5 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
