"use client";

import { useState, useEffect } from "react";

type Category = {
  id: number;
  name: string;
};

type MenuItem = {
  id: number;
  menu_id: number;
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
  image_url: string | null;
  category_ids: number[];
  categories: Category[];
};

type Menu = {
  id: number;
  restaurant_id: number;
  name: string | null;
  is_active: boolean;
  items: MenuItem[];
};

type Restaurant = {
  id: number;
  name: string;
  owner_name?: string;
};

type RestaurantMenu = {
  restaurant_id: number;
  restaurant_name: string;
  menus: Menu[];
};

type MenuItemFormData = {
  name: string;
  description: string | null;
  price_cents: number;
  is_available: boolean;
  image_url: string | null;
  category_ids: number[];
};

export default function MenuManagementPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [menuData, setMenuData] = useState<RestaurantMenu | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchRestaurantMenu(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  const fetchRestaurants = async () => {
    try {
      console.log('Fetching restaurants from:', `${API_BASE_URL}/admin/restaurants/`);
      const res = await fetch(`${API_BASE_URL}/admin/restaurants/`);
      const data = await res.json();
      
      if (res.ok) {
        console.log('Restaurants fetched:', data.restaurants);
        setRestaurants(data.restaurants || []);
        if (data.restaurants?.length > 0 && !selectedRestaurantId) {
          setSelectedRestaurantId(data.restaurants[0].id);
        }
      } else {
        console.error('Failed to fetch restaurants:', data);
        setError('Failed to load restaurants');
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Network error. Please check if backend is running.');
    }
  };

  const fetchRestaurantMenu = async (restaurantId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/menu/restaurant/${restaurantId}`);
      if (res.ok) {
        const data = await res.json();
        setMenuData(data);
      } else {
        setMenuData(null);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMenuData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/menu/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/menu/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (res.ok) {
        const newCategory = await res.json();
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
        setShowCategoryModal(false);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Delete this category? It will be removed from all menu items.')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/menu/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCategories(categories.filter(c => c.id !== categoryId));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleCreateMenu = async (menuName: string) => {
    if (!selectedRestaurantId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/menu/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: selectedRestaurantId,
          name: menuName,
          is_active: true
        }),
      });

      if (res.ok) {
        await fetchRestaurantMenu(selectedRestaurantId);
        setShowAddMenuModal(false);
      }
    } catch (error) {
      console.error('Error creating menu:', error);
    }
  };

  const handleDeleteMenu = async (menuId: number) => {
    if (!confirm('Delete this menu? All items will also be deleted.')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/menu/menus/${menuId}`, {
        method: 'DELETE',
      });

      if (res.ok && selectedRestaurantId) {
        await fetchRestaurantMenu(selectedRestaurantId);
      }
    } catch (error) {
      console.error('Error deleting menu:', error);
    }
  };

  const handleCreateMenuItem = async (menuId: number, itemData: MenuItemFormData) => {
    try {
      // Ensure data is properly formatted
      const submitData = {
        name: itemData.name,
        description: itemData.description,  // Keep as is (can be string or null)
        price_cents: Number(itemData.price_cents),
        is_available: itemData.is_available,
        image_url: itemData.image_url,      // Keep as is (can be string or null)
        category_ids: itemData.category_ids.map(id => Number(id))
      };
      
      console.log('Creating menu item with data:', submitData);
      
      const res = await fetch(`${API_BASE_URL}/menu/menus/${menuId}/items`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(submitData),
      });

      const responseData = await res.json();
      console.log('Response:', responseData);
      
      if (!res.ok) {
        throw new Error(responseData.detail || 'Failed to create menu item');
      }

      if (res.ok && selectedRestaurantId) {
        await fetchRestaurantMenu(selectedRestaurantId);
        setShowAddItemModal(false);
        setSelectedMenu(null);
      }
    } catch (error) {
      console.error('Error creating menu item:', error);
      alert(error instanceof Error ? error.message : 'Failed to create menu item');
    }
  };

  const handleUpdateMenuItem = async (itemId: number, itemData: Partial<MenuItemFormData>) => {
    try {
      const submitData: Partial<MenuItemFormData> = {};
      
      if (itemData.name !== undefined) submitData.name = itemData.name;
      if (itemData.description !== undefined) submitData.description = itemData.description;
      if (itemData.price_cents !== undefined) submitData.price_cents = Number(itemData.price_cents);
      if (itemData.is_available !== undefined) submitData.is_available = itemData.is_available;
      if (itemData.image_url !== undefined) submitData.image_url = itemData.image_url;
      if (itemData.category_ids !== undefined) submitData.category_ids = itemData.category_ids.map(id => Number(id));
      
      console.log('Updating menu item with data:', submitData);
      
      const res = await fetch(`${API_BASE_URL}/menu/items/${itemId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(submitData),
      });

      const responseData = await res.json();
      console.log('Response:', responseData);
      
      if (!res.ok) {
        throw new Error(responseData.detail || 'Failed to update menu item');
      }

      if (res.ok && selectedRestaurantId) {
        await fetchRestaurantMenu(selectedRestaurantId);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert(error instanceof Error ? error.message : 'Failed to update menu item');
    }
  };

  const handleToggleAvailability = async (itemId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/menu/items/${itemId}/availability?is_available=${!currentStatus}`,
        { method: 'PATCH' }
      );

      if (res.ok && selectedRestaurantId) {
        await fetchRestaurantMenu(selectedRestaurantId);
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleDeleteMenuItem = async (itemId: number) => {
    if (!confirm('Delete this item?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/menu/items/${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok && selectedRestaurantId) {
        await fetchRestaurantMenu(selectedRestaurantId);
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-6">
          Error: {error}
        </div>
        <button
          onClick={fetchRestaurants}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold gradient-primary text-transparent bg-clip-text">
          Menu Management
        </h1>
        <div className="space-x-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 transition-all shadow-soft hover:shadow-glow"
          >
            Manage Categories
          </button>
          <button
            onClick={() => setShowAddMenuModal(true)}
            className="px-4 py-2 bg-success text-success-foreground rounded-xl hover:bg-success/90 transition-all shadow-soft hover:shadow-glow"
            disabled={!selectedRestaurantId}
          >
            Add Menu
          </button>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-soft hover:shadow-glow"
            disabled={!menuData?.menus.length}
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Restaurant Selector */}
      <div className="mb-6 glass-card p-4 rounded-xl">
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Select Restaurant
        </label>
        {loading && restaurants.length === 0 ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading restaurants...</span>
          </div>
        ) : (
          <select
            value={selectedRestaurantId || ''}
            onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
            className="w-full md:w-96 border border-border rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="">Select a restaurant</option>
            {restaurants.length > 0 ? (
              restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))
            ) : (
              <option value="" disabled>No restaurants available</option>
            )}
          </select>
        )}
        {restaurants.length === 0 && !loading && (
          <p className="text-sm text-destructive mt-2">
            No restaurants found. Please add a restaurant first.
          </p>
        )}
      </div>

      {/* Menu Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : menuData ? (
        <div className="space-y-6">
          {menuData.menus.map((menu) => (
            <div key={menu.id} className="glass-card rounded-2xl p-6 hover:shadow-glow transition-all">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    {menu.name || 'Unnamed Menu'}
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      menu.is_active 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {menu.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {menu.items.length} {menu.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMenu(menu);
                      setShowAddItemModal(true);
                    }}
                    className="text-primary hover:text-primary/80 px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    + Add Item
                  </button>
                  <button
                    onClick={() => handleDeleteMenu(menu.id)}
                    className="text-destructive hover:text-destructive/80 px-3 py-1.5 rounded-xl hover:bg-destructive/10 transition-colors"
                  >
                    Delete Menu
                  </button>
                </div>
              </div>

              {menu.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 glass rounded-xl">
                  No items in this menu
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menu.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-4 shadow-card hover:shadow-soft transition-all border border-border/30">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-40 object-cover rounded-xl mb-3"
                        />
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <span className="font-bold text-primary">
                          {formatPrice(item.price_cents)}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{item.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.categories.map(cat => (
                          <span key={cat.id} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                            {cat.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleToggleAvailability(item.id, item.is_available)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.is_available 
                              ? 'bg-success/10 text-success hover:bg-success/20'
                              : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          }`}
                        >
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </button>
                        
                        <div className="space-x-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-primary hover:text-primary/80 text-sm px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="text-destructive hover:text-destructive/80 text-sm px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
          No menu found for this restaurant
        </div>
      )}

      {/* Modals */}
      {showAddMenuModal && (
        <MenuModal
          onClose={() => setShowAddMenuModal(false)}
          onSave={handleCreateMenu}
        />
      )}

      {(showAddItemModal || editingItem) && (
        <MenuItemModal
          menu={selectedMenu || menuData?.menus[0]}
          categories={categories}
          item={editingItem}
          onClose={() => {
            setShowAddItemModal(false);
            setSelectedMenu(null);
            setEditingItem(null);
          }}
          onSave={(itemData: MenuItemFormData) => {
            if (editingItem) {
              handleUpdateMenuItem(editingItem.id, itemData);
            } else if (selectedMenu) {
              handleCreateMenuItem(selectedMenu.id, itemData);
            } else if (menuData?.menus[0]) {
              handleCreateMenuItem(menuData.menus[0].id, itemData);
            }
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onCreateCategory={handleCreateCategory}
          onDeleteCategory={handleDeleteCategory}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
        />
      )}
    </div>
  );
}

// Menu Modal Component
interface MenuModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
}

const MenuModal = ({ onClose, onSave }: MenuModalProps) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave(name);
    } catch (error) {
      console.error('Error creating menu:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-96 glass-card">
        <h2 className="text-xl font-bold gradient-primary text-transparent bg-clip-text mb-4">
          Create New Menu
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Menu name"
            autoFocus
            required
            disabled={isSubmitting}
          />
          <div className="flex justify-end space-x-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Menu Item Modal Component
interface MenuItemModalProps {
  menu?: Menu;
  categories: Category[];
  item?: MenuItem | null;
  onClose: () => void;
  onSave: (itemData: MenuItemFormData) => void;
}

const MenuItemModal = ({ menu, categories, item, onClose, onSave }: MenuItemModalProps) => {
  // Initialize form data with item data or defaults
  const [formData, setFormData] = useState<MenuItemFormData>(() => {
    if (item) {
      // If we have an item, get category IDs from either:
      // 1. item.category_ids if available
      // 2. Extract from item.categories array
      let categoryIds: number[] = [];
      
      if (item.category_ids && item.category_ids.length > 0) {
        categoryIds = item.category_ids;
      } else if (item.categories && item.categories.length > 0) {
        categoryIds = item.categories.map(c => c.id);
      }
      
      return {
        name: item.name || '',
        description: item.description || '',
        price_cents: item.price_cents || 0,
        is_available: item.is_available ?? true,
        image_url: item.image_url || '',
        category_ids: categoryIds
      };
    } else {
      // Default values for new item
      return {
        name: '',
        description: '',
        price_cents: 0,
        is_available: true,
        image_url: '',
        category_ids: []
      };
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Log for debugging
  useEffect(() => {
    console.log('MenuItemModal - item:', item);
    console.log('MenuItemModal - formData:', formData);
    console.log('MenuItemModal - categories:', categories);
  }, [item, formData, categories]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    if (formData.price_cents <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters except decimal point
    let value = e.target.value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    
    // Parse the value
    const dollars = parseFloat(value) || 0;
    const cents = Math.max(0, Math.round(dollars * 100));
    
    setFormData({ ...formData, price_cents: cents });
    
    if (cents > 0 && errors.price) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.price;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Prepare data for submission - convert empty strings to null
      const submitData: MenuItemFormData = {
        name: formData.name,
        description: formData.description?.trim() ? formData.description : null,
        price_cents: Number(formData.price_cents),
        is_available: formData.is_available,
        image_url: formData.image_url?.trim() ? formData.image_url : null,
        category_ids: formData.category_ids.map(id => Number(id))
      };
      
      console.log('Submitting menu item:', submitData);
      await onSave(submitData);
      onClose(); // Close modal on success
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MenuItemFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[90vh] overflow-y-auto glass-card">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-border pb-4 mb-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            ✕
          </button>
          
          <h2 className="text-xl font-bold gradient-primary text-transparent bg-clip-text">
            {item ? 'Edit Item' : 'New Item'}
            {menu && <span className="text-sm font-normal text-muted-foreground ml-2">in {menu.name || 'Unnamed Menu'}</span>}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                errors.name ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Enter item name"
              disabled={isSubmitting}
              required
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground/70 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={3}
              placeholder="Enter item description (optional)"
              disabled={isSubmitting}
            />
          </div>

          {/* Price Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Price ($) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">$</span>
              <input
                type="text"
                value={(formData.price_cents / 100).toFixed(2)}
                onChange={handlePriceChange}
                className={`w-full border rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.price ? 'border-destructive' : 'border-border'
                }`}
                placeholder="0.00"
                disabled={isSubmitting}
                required
                inputMode="decimal"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-xs text-destructive">{errors.price}</p>
            )}
          </div>

          {/* Image URL Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground/70 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image_url || ''}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://example.com/image.jpg (optional)"
              disabled={isSubmitting}
            />
          </div>

          {/* Categories Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground/70 mb-1">Categories</label>
            <div className="border border-border rounded-xl p-3 max-h-40 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">No categories yet</p>
              ) : (
                categories.map((cat) => {
                  // Check if this category is selected
                  const isChecked = formData.category_ids.includes(cat.id);
                  
                  return (
                    <label key={cat.id} className="flex items-center mb-2 hover:bg-muted/30 p-2 rounded-lg transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...formData.category_ids, cat.id]
                            : formData.category_ids.filter((id) => id !== cat.id);
                          handleInputChange('category_ids', newIds);
                        }}
                        className="mr-2 accent-primary w-4 h-4"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm">{cat.name}</span>
                      {isChecked && (
                        <span className="ml-2 text-xs text-primary">✓</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            {formData.category_ids.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formData.category_ids.length} categor{formData.category_ids.length === 1 ? 'y' : 'ies'} selected
              </p>
            )}
          </div>

          {/* Availability Checkbox */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-muted/30 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => handleInputChange('is_available', e.target.checked)}
                className="w-4 h-4 accent-primary"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-foreground/70">Available for order</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || formData.price_cents <= 0}
              className={`px-4 py-2 bg-primary text-primary-foreground rounded-xl transition-all min-w-[100px] ${
                isSubmitting || !formData.name.trim() || formData.price_cents <= 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-primary/90 hover:shadow-glow'
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
                item ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Modal Component
interface CategoryModalProps {
  categories: Category[];
  onClose: () => void;
  onCreateCategory: () => void;
  onDeleteCategory: (id: number) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
}

const CategoryModal = ({ 
  categories, 
  onClose, 
  onCreateCategory, 
  onDeleteCategory,
  newCategoryName,
  setNewCategoryName 
}: CategoryModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateCategory();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-96 glass-card">
        <h2 className="text-xl font-bold gradient-primary text-transparent bg-clip-text mb-4">
          Manage Categories
        </h2>
        
        <div className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="New category name"
              onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleCreate()}
              disabled={isSubmitting}
            />
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !newCategoryName.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto border border-border rounded-xl">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No categories yet</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="flex justify-between items-center p-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium">{cat.name}</span>
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="text-destructive hover:text-destructive/80 text-sm px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors"
                  disabled={isSubmitting}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors"
            disabled={isSubmitting}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};