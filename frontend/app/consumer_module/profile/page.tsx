"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCustomerAuth } from "@/app/_providers/CustomerAuthProvider";
import {
  getProfile,
  updateProfile,
  updateEmail,
  changePassword,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type CustomerProfile,
  type AddressRecord,
} from "@/lib/customerApi";
import { Navigation, Loader2 } from "lucide-react";

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

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function ProfilePage() {
  const { isLoggedIn, updateUser } = useCustomerAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editProfile, setEditProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  // ----- Email edit state -----
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  // ----- Password change state -----
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ----- Address state -----
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    label: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [geoLoading, setGeoLoading] = useState(false);

  const loadData = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const [p, a] = await Promise.all([getProfile(), listAddresses()]);
      setProfile(p);
      setAddresses(a);
      setEditProfile({
        first_name: p.first_name ?? "",
        last_name: p.last_name ?? "",
        phone: p.phone ?? "",
      });
    } catch {
      setProfile(null);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateProfile(editProfile);
      setProfile(updated);
      // Update navbar immediately
      updateUser({
        first_name: updated.first_name ?? undefined,
        last_name: updated.last_name ?? undefined,
      });
      setMessage({ type: "ok", text: "Profile saved." });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  // ----- Email update handler -----
  const handleStartEditEmail = () => {
    setEditingEmail(true);
    setNewEmail(profile?.email ?? "");
    setEmailError("");
  };

  const handleCancelEditEmail = () => {
    setEditingEmail(false);
    setNewEmail("");
    setEmailError("");
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const trimmed = newEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (trimmed === (profile?.email ?? "").toLowerCase()) {
      setEmailError("This is already your current email");
      return;
    }
    setEmailSaving(true);
    try {
      const updated = await updateEmail({ new_email: trimmed });
      setProfile(updated);
      setEditingEmail(false);
      setNewEmail("");
      // Update navbar immediately
      updateUser({ email: updated.email ?? trimmed });
      setMessage({ type: "ok", text: "Email updated successfully." });
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to update email");
    } finally {
      setEmailSaving(false);
    }
  };

  // ----- Password change handler -----
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: "err", text: "New password and confirm password do not match" });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordMessage({ type: "err", text: "New password must be at least 6 characters" });
      return;
    }
    setPasswordSaving(true);
    try {
      const result = await changePassword(passwordForm);
      setPasswordMessage({ type: "ok", text: result.message });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPasswordMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to change password" });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAutoFillAddress = () => {
    if (!navigator.geolocation) {
      setMessage({ type: "err", text: "Geolocation is not supported by your browser" });
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setAddressForm(prev => ({ ...prev, latitude, longitude }));
        
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
          if (token) {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`
            );
            const data = await res.json();
            if (data.features && data.features.length > 0) {
              const place = data.features[0];
              const context = place.context || [];
              
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

              // Myanmar postal code fallback
              if (!newAddress.postal_code && (newAddress.country?.toLowerCase() === "myanmar" || place.place_name?.toLowerCase().includes("myanmar"))) {
                const stateName = newAddress.state || context.find((c: any) => c.id.startsWith("region"))?.text;
                if (stateName) {
                  const prefix = Object.entries(MYANMAR_POSTAL_PREFIXES).find(([key]) => 
                    stateName.toLowerCase().includes(key.toLowerCase())
                  )?.[1];
                  
                  if (prefix) {
                    newAddress.postal_code = `${prefix}011`;
                  }
                }
              }
              
              setAddressForm(prev => ({ ...prev, ...newAddress, latitude, longitude }));
              setMessage({ type: "ok", text: "Address auto-filled from your location." });
            }
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          setMessage({ type: "err", text: "Could not fetch address details. Coordinates saved." });
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGeoLoading(false);
        setMessage({ type: "err", text: "Unable to retrieve your location. Please check browser permissions." });
      }
    );
  };

  // ----- Address handlers -----
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    let currentLatitude = addressForm.latitude;
    let currentLongitude = addressForm.longitude;

    try {
      const { latitude, longitude } = await getUserLocation();
      currentLatitude = latitude;
      currentLongitude = longitude;
      setMessage({ type: "ok", text: "Location captured." });
    } catch (error) {
      console.warn("Could not get user location:", error);
      setMessage({ type: "err", text: "Could not get current location. Address will be saved without coordinates." });
    }

    try {
      await createAddress({
        street: addressForm.street || undefined,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.postal_code,
        country: addressForm.country,
        label: addressForm.label || undefined,
        latitude: currentLatitude || undefined,
        longitude: currentLongitude || undefined,
      });
      await loadData();
      setShowAddAddress(false);
      setAddressForm({
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        label: "",
        latitude: null,
        longitude: null,
      });
      if (!message || message.type !== "err") { // Only show success if no prior error message
        setMessage({ type: "ok", text: "Address added." });
      }
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to add address" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAddress = async (id: number, e: React.FormEvent) => {
    e.preventDefault();
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    setSaving(true);
    setMessage(null);

    let currentLatitude = addressForm.latitude;
    let currentLongitude = addressForm.longitude;

    try {
      const { latitude, longitude } = await getUserLocation();
      currentLatitude = latitude;
      currentLongitude = longitude;
      setMessage({ type: "ok", text: "Location captured." });
    } catch (error) {
      console.warn("Could not get user location for update:", error);
      setMessage({ type: "err", text: "Could not get current location. Address will be updated without new coordinates." });
    }

    try {
      await updateAddress(id, {
        street: addressForm.street || undefined,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.postal_code,
        country: addressForm.country,
        label: addressForm.label || undefined,
        latitude: currentLatitude || undefined,
        longitude: currentLongitude || undefined,
      });
      await loadData();
      setEditingAddressId(null);
      if (!message || message.type !== "err") { // Only show success if no prior error message
        setMessage({ type: "ok", text: "Address updated." });
      }
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to update" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Remove this address?")) return;
    setSaving(true);
    setMessage(null);
    try {
      await deleteAddress(id);
      await loadData();
      setEditingAddressId(null);
      setMessage({ type: "ok", text: "Address removed." });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to delete" });
    } finally {
      setSaving(false);
    }
  };

  const startEditAddress = (a: AddressRecord) => {
    setEditingAddressId(a.id);
    setAddressForm({
      street: a.street ?? "",
      city: a.city,
      state: a.state,
      postal_code: a.postal_code,
      country: a.country,
      label: a.label ?? "",
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
    });
  };

  const cancelAddressForm = () => {
    setShowAddAddress(false);
    setEditingAddressId(null);
    setAddressForm({
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      label: "",
      latitude: null,
      longitude: null,
    });
  };

  const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            reject(new Error("Failed to get location. Please allow location access."));
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        reject(new Error("Geolocation is not supported by your browser."));
      }
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">Sign in to view and edit your profile.</p>
            <Link
              href="/login?redirect=/consumer_module/profile"
              className="inline-block mt-6 bg-[#e4002b] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#c40026]"
            >
              Sign in
            </Link>
            <Link href="/consumer_module" className="inline-block mt-4 ml-4 text-[#e4002b] font-semibold hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-gray-500">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <Link href="/consumer_module" className="text-[#e4002b] font-medium hover:underline">
            Back to home
          </Link>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Personal info</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                value={editProfile.first_name}
                onChange={(e) => setEditProfile((p) => ({ ...p, first_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e4002b]/20 focus:border-[#e4002b]"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                value={editProfile.last_name}
                onChange={(e) => setEditProfile((p) => ({ ...p, last_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e4002b]/20 focus:border-[#e4002b]"
                placeholder="Last name"
              />
            </div>

            {/* Email field — editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {editingEmail ? (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailError("");
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e4002b]/20 focus:border-[#e4002b]"
                    placeholder="Enter new email"
                    autoFocus
                  />
                  {emailError && (
                    <p className="text-sm text-red-600">{emailError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEmail}
                      disabled={emailSaving}
                      className="px-4 py-2 bg-[#e4002b] text-white rounded-lg font-medium hover:bg-[#c40026] disabled:opacity-70"
                    >
                      {emailSaving ? "Saving…" : "Save email"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditEmail}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={profile?.email ?? ""}
                    disabled
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={handleStartEditEmail}
                    className="px-4 py-2 text-[#e4002b] font-semibold hover:underline whitespace-nowrap"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={editProfile.phone}
                onChange={(e) => setEditProfile((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e4002b]/20 focus:border-[#e4002b]"
                placeholder="+1 234 567 8900"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-70"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        {/* Change Password card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Change password</h2>

          {passwordMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${passwordMessage.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e4002b]/20 focus:border-[#e4002b]"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e4002b]/20 focus:border-[#e4002b]"
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm_password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#e4002b]/20 focus:border-[#e4002b]"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full py-3 bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-70"
            >
              {passwordSaving ? "Changing…" : "Change password"}
            </button>
          </form>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Delivery addresses</h2>
            {!showAddAddress && !editingAddressId && (
              <button
                type="button"
                onClick={() => setShowAddAddress(true)}
                className="text-[#e4002b] font-semibold hover:underline"
              >
                + Add address
              </button>
            )}
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3">
              <button
                type="button"
                onClick={handleAutoFillAddress}
                disabled={geoLoading}
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-gray-200 rounded-xl hover:border-[#e4002b] hover:text-[#e4002b] transition-all text-sm font-medium"
              >
                {geoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#e4002b]" />
                ) : (
                  <Navigation className="w-4 h-4 text-[#e4002b]" />
                )}
                {geoLoading ? "Fetching location..." : "Use current location"}
              </button>
              <h3 className="font-medium text-gray-900">New address</h3>
              <input
                type="text"
                placeholder="Street"
                value={addressForm.street}
                onChange={(e) => setAddressForm((f) => ({ ...f, street: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Postal code"
                  value={addressForm.postal_code}
                  onChange={(e) => setAddressForm((f) => ({ ...f, postal_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Label (e.g. Home, Work)"
                value={addressForm.label}
                onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#e4002b] text-white rounded-lg font-medium">
                  {saving ? "Adding…" : "Add"}
                </button>
                <button type="button" onClick={cancelAddressForm} className="px-4 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="border border-gray-200 rounded-xl p-4">
                {editingAddressId === addr.id ? (
                  <form onSubmit={(e) => handleUpdateAddress(addr.id, e)} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Street"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm((f) => ({ ...f, street: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFillAddress}
                      disabled={geoLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 border-2 border-gray-200 rounded-xl hover:border-[#e4002b] hover:text-[#e4002b] transition-all text-sm font-medium"
                    >
                      {geoLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#e4002b]" />
                      ) : (
                        <Navigation className="w-4 h-4 text-[#e4002b]" />
                      )}
                      {geoLoading ? "Fetching location..." : "Use current location"}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Postal code"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm((f) => ({ ...f, postal_code: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={saving} className="px-4 py-2 bg-[#e4002b] text-white rounded-lg font-medium">
                        Save
                      </button>
                      <button type="button" onClick={cancelAddressForm} className="px-4 py-2 border border-gray-300 rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        {addr.label && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded mr-2">
                            {addr.label}
                          </span>
                        )}
                        <p className="text-gray-900 mt-1">
                          {[addr.street, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditAddress(addr)}
                          className="text-sm text-[#e4002b] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-sm text-gray-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {addresses.length === 0 && !showAddAddress && (
            <p className="text-gray-500 text-sm">No saved addresses. Add one for quicker checkout.</p>
          )}
        </div>
      </div>
    </div>
  );
}
