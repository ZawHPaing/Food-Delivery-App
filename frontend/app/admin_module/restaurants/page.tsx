"use client";

import { useState, useEffect } from "react";
import { Restaurant, RestaurantStats, CreateRestaurant } from "@/types/admin_restaurant";
import { createPortal } from "react-dom";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('Component mounted');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    // Test if backend is reachable
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => console.log('Health check:', data))
      .catch(err => console.error('Health check failed:', err));
    
    fetchData();
    
    return () => setMounted(false);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching restaurants from:', `${API_BASE_URL}/admin/restaurants/`);
      
      const [restaurantsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/restaurants/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/admin/restaurants/stats/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      console.log('Restaurants response status:', restaurantsRes.status);
      
      if (!restaurantsRes.ok) {
        const errorText = await restaurantsRes.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch restaurants: ${restaurantsRes.status}`);
      }

      const restaurantsData = await restaurantsRes.json();
      console.log('Restaurants data:', restaurantsData);
      
      if (restaurantsData.restaurants && Array.isArray(restaurantsData.restaurants)) {
        setRestaurants(restaurantsData.restaurants);
        
        console.log('Restaurant metrics:', restaurantsData.restaurants.map((r: Restaurant) => ({
          name: r.name,
          menu_count: r.menu_count,
          order_count: r.order_count,
          average_rating: r.average_rating,
          image_url: r.image_url
        })));
      } else {
        console.error('Unexpected data format:', restaurantsData);
        setRestaurants([]);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('Stats data:', statsData);
        
        // The stats might be returned directly or nested
        if (statsData.success) {
          // If the API returns {success: true, total_restaurants: X, ...}
          setStats({
            total_restaurants: statsData.total_restaurants || 0,
            approved_restaurants: statsData.approved_restaurants || 0,
            pending_approval: statsData.pending_approval || 0,
            restaurants_by_city: statsData.restaurants_by_city || {},
            restaurants_by_cuisine: statsData.restaurants_by_cuisine || {}
          });
        } else {
          // If the API returns the stats directly
          setStats(statsData);
        }
      } else {
        console.error('Stats response not OK:', statsRes.status);
        const errorText = await statsRes.text();
        console.error('Stats error:', errorText);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number, approve: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/restaurants/${id}/approve?approve=${approve}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        await fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || 'Failed to update restaurant status');
      }
    } catch (error) {
      console.error('Error approving restaurant:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/restaurants/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        await fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || 'Failed to delete restaurant');
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleCreateRestaurant = async (restaurantData: CreateRestaurant) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/restaurants/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(restaurantData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create restaurant');
      }

      await fetchData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating restaurant:', error);
      alert(error instanceof Error ? error.message : 'Failed to create restaurant');
      throw error;
    }
  };

  const handleUpdateRestaurant = async (id: number, restaurantData: Partial<CreateRestaurant>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/restaurants/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(restaurantData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update restaurant');
      }

      await fetchData();
      setShowEditModal(false);
      setSelectedRestaurant(null);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert(error instanceof Error ? error.message : 'Failed to update restaurant');
      throw error;
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (filter === 'approved') return r.is_approved;
    if (filter === 'pending') return !r.is_approved;
    return true;
  });

  const getCuisineIcon = (cuisine: string | null) => {
    const icons: Record<string, string> = {
      'italian': '🍕',
      'chinese': '🥡',
      'japanese': '🍣',
      'mexican': '🌮',
      'indian': '🍛',
      'thai': '🍜',
      'american': '🍔',
      'french': '🥐',
      'mediterranean': '🥙',
    };
    return icons[cuisine?.toLowerCase() || ''] || '🍽️';
  };

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-6">
          Error: {error}
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
<div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
    Restaurant Management
  </h1>
  <button
    onClick={() => setShowAddModal(true)}
    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-soft hover:shadow-lg"
  >
    + Add Restaurant
  </button>
</div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl">
            <div className="text-sm text-muted-foreground">Total Restaurants</div>
            <div className="text-2xl font-bold text-foreground">{stats.total_restaurants}</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-sm text-muted-foreground">Approved</div>
            <div className="text-2xl font-bold text-success">{stats.approved_restaurants}</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-sm text-muted-foreground">Pending Approval</div>
            <div className="text-2xl font-bold text-warning">{stats.pending_approval}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-2">
        {['all', 'approved', 'pending'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl capitalize transition-all ${
              filter === tab
                ? 'bg-primary text-primary-foreground'
                : 'glass hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Restaurants Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="glass-card rounded-2xl p-6 hover:shadow-glow transition-all">
                {/* Image Preview */}
                {restaurant.image_url && (
                  <div className="mb-3 rounded-xl overflow-hidden h-32">
                    <img 
                      src={restaurant.image_url} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getCuisineIcon(restaurant.cuisine_type)}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">{restaurant.city || 'Location not set'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    restaurant.is_approved 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {restaurant.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                {restaurant.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{restaurant.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-muted/30 rounded-xl">
                    <div className="text-xs text-muted-foreground">Menu Items</div>
                    <div className="font-semibold">{restaurant.menu_count || 0}</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-xl">
                    <div className="text-xs text-muted-foreground">Orders</div>
                    <div className="font-semibold">{restaurant.order_count || 0}</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded-xl">
                    <div className="text-xs text-muted-foreground">Rating</div>
                    <div className="font-semibold">{restaurant.average_rating?.toFixed(1) || '0.0'} ⭐</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setShowEditModal(true);
                      }}
                      className="text-primary hover:text-primary/80 text-sm px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.id)}
                      className="text-destructive hover:text-destructive/80 text-sm px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  {!restaurant.is_approved && (
                    <button
                      onClick={() => handleApprove(restaurant.id, true)}
                      className="text-success hover:text-success/80 text-sm px-3 py-1.5 rounded-lg hover:bg-success/10 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground glass-card rounded-2xl">
              No restaurants found. Click "Add Restaurant" to create one.
            </div>
          )}
        </div>
      )}

      {/* Modals using Portal */}
      {mounted && showAddModal && createPortal(
        <RestaurantModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateRestaurant}
        />,
        document.body
      )}

      {mounted && showEditModal && selectedRestaurant && createPortal(
        <RestaurantModal
          restaurant={selectedRestaurant}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRestaurant(null);
          }}
          onSave={(data) => handleUpdateRestaurant(selectedRestaurant.id, data)}
        />,
        document.body
      )}
    </div>
  );
}

// Restaurant Modal Component
interface RestaurantModalProps {
  restaurant?: Restaurant;
  onClose: () => void;
  onSave: (data: CreateRestaurant) => Promise<void>;
}

const RestaurantModal = ({ restaurant, onClose, onSave }: RestaurantModalProps) => {
  const [formData, setFormData] = useState<CreateRestaurant>({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    image_url: restaurant?.image_url || '',
    city: restaurant?.city || '',
    cuisine_type: restaurant?.cuisine_type || '',
    is_approved: restaurant?.is_approved || false,
    latitude: restaurant?.latitude,
    longitude: restaurant?.longitude,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(restaurant?.image_url || null);

  const cuisineOptions = [
    'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian',
    'Thai', 'American', 'French', 'Mediterranean', 'Other'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Restaurant name is required';
    }
    
    // Optional: Validate image URL format if provided
    if (formData.image_url && !formData.image_url.match(/^https?:\/\/.+/)) {
      newErrors.image_url = 'Please enter a valid URL starting with http:// or https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateRestaurant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update image preview if image_url changes
    if (field === 'image_url') {
      setImagePreview(value || null);
    }
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✕
          </button>
          
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
            {restaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h2>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter restaurant name"
                disabled={isSubmitting}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                rows={3}
                placeholder="Enter restaurant description"
                disabled={isSubmitting}
              />
            </div>

            {/* Image URL field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.image_url || ''}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all ${
                  errors.image_url ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/restaurant-image.jpg"
                disabled={isSubmitting}
              />
              {errors.image_url && (
                <p className="mt-1 text-xs text-red-500">{errors.image_url}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Optional: Add a URL for the restaurant's cover image
              </p>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-3 rounded-xl overflow-hidden h-32 border border-gray-300">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={() => setImagePreview(null)}
                  />
                </div>
              )}
            </div>

            {/* City and Cuisine fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="e.g., New York"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                <select
                  value={formData.cuisine_type || ''}
                  onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  disabled={isSubmitting}
                >
                  <option value="">Select cuisine</option>
                  {cuisineOptions.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Approved checkbox */}
            <div className="py-2">
              <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_approved}
                  onChange={(e) => handleInputChange('is_approved', e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                  disabled={isSubmitting}
                />
                <span className="text-sm font-medium text-gray-700">
                  Approved (visible to customers)
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 mt-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className={`px-4 py-2 bg-red-600 text-white rounded-xl transition-all min-w-[120px] ${
                isSubmitting || !formData.name.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-red-700 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </span>
              ) : (
                restaurant ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};