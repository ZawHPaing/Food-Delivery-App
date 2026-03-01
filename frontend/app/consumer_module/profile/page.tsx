"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCustomerAuth } from "@/app/_providers/CustomerAuthProvider";
import {
  getProfile,
  updateProfile,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type CustomerProfile,
  type AddressRecord,
} from "@/lib/customerApi";

export default function ProfilePage() {
  const { isLoggedIn } = useCustomerAuth();
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
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    label: "",
    is_default: false,
  });

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
      setMessage({ type: "ok", text: "Profile saved." });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await createAddress({
        street: addressForm.street || undefined,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.postal_code,
        country: addressForm.country,
        label: addressForm.label || undefined,
        is_default: addressForm.is_default,
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
        is_default: false,
      });
      setMessage({ type: "ok", text: "Address added." });
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
    try {
      await updateAddress(id, {
        street: addressForm.street || undefined,
        city: addressForm.city,
        state: addressForm.state,
        postal_code: addressForm.postal_code,
        country: addressForm.country,
        label: addressForm.label || undefined,
        is_default: addressForm.is_default,
      });
      await loadData();
      setEditingAddressId(null);
      setMessage({ type: "ok", text: "Address updated." });
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
      is_default: a.is_default,
    });
  };

  const cancelAddressForm = () => {
    setShowAddAddress(false);
    setEditingAddressId(null);
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
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profile?.email ?? ""}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed here.</p>
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
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm((f) => ({ ...f, is_default: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Default address</span>
              </label>
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
                        {addr.is_default && (
                          <span className="text-xs text-green-600 font-medium">Default</span>
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
