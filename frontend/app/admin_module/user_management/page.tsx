"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: string;
  created_at: string;
};

type EditUserData = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserData>({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
    return () => setMounted(false);
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter 
        ? `http://localhost:8000/admin/users/?user_type=${filter}`
        : "http://localhost:8000/admin/users/";
      
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        console.error(data);
        setUsers([]);
        setError(data.detail || "Failed to fetch users");
        return;
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setUsers([]);
      setError("Network error while fetching users");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const res = await fetch(`http://localhost:8000/admin/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.detail || "Failed to delete user");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error while deleting user");
    }
  };

  const changeRole = async (id: number, role: string) => {
    try {
      console.log(`Changing user ${id} role to:`, role);
      
      const res = await fetch(`http://localhost:8000/admin/users/${id}/role`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          user_id: id,
          user_type: role 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.detail || "Failed to update user role");
      }
    } catch (err) {
      console.error("Role change error:", err);
      alert("Network error while updating role");
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
    });
    setError(null);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditFormData({
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
    });
    setError(null);
    setIsSubmitting(false);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Submitting edit for user:", editingUser.id);
      console.log("Form data:", editFormData);

      const res = await fetch(`http://localhost:8000/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: editFormData.email || undefined,
          first_name: editFormData.first_name || undefined,
          last_name: editFormData.last_name || undefined,
          phone: editFormData.phone || undefined,
        }),
      });

      console.log("Response status:", res.status);
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to update user");
      }

      await fetchUsers();
      closeEditModal();
    } catch (err) {
      console.error("Edit error:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case 'admin':
        return 'bg-destructive/10 text-destructive';
      case 'owner':
        return 'bg-primary/10 text-primary';
      case 'rider':
        return 'bg-success/10 text-success';
      case 'rider_pending':
        return 'bg-warning/10 text-warning border border-warning/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch(role) {
      case 'rider_pending':
        return 'Rider (Pending)';
      case 'rider':
        return 'Rider';
      case 'admin':
        return 'Admin';
      case 'owner':
        return 'Owner';
      default:
        return role || 'Customer';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
          User Management
        </h1>
        <div className="glass px-4 py-2 rounded-xl text-sm">
          Total Users: <span className="font-bold text-primary">{users.length}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center space-x-4 glass-card p-4 rounded-xl">
        <label className="font-medium text-foreground/70">Filter by role:</label>
        <select
          className="border border-border rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Users</option>
          <option value="customer">Customer</option>
          <option value="rider_pending">Rider (Pending)</option>
          <option value="rider">Rider (Approved)</option>
          <option value="owner">Restaurant Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-xl">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-border/30">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.user_type)}`}>
                      {getRoleDisplayName(user.user_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      Edit
                    </button>
                    <select
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      value={user.user_type}
                      className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="customer">Customer</option>
                      <option value="rider_pending">Rider (Pending)</option>
                      <option value="rider">Rider (Approved)</option>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-destructive hover:text-destructive/80 ml-2 px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit User Modal using Portal */}
      {mounted && editingUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto py-8">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={closeEditModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl mx-4">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 mb-4">
              Edit User
            </h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="user@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* First Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={editFormData.first_name}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="John"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Last Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={editFormData.last_name}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="+1 234 567 8900"
                  disabled={isSubmitting}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
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
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}