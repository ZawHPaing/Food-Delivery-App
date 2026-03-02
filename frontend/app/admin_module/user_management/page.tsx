"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: string;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = filter 
        ? `http://localhost:8000/admin/users/?user_type=${filter}`
        : "http://localhost:8000/admin/users/";
      
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        console.error(data);
        setUsers([]);
        return;
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

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
      console.log(`Changing user ${id} role to:`, role); // Debug log
      
      // Send both user_id and user_type in the body as expected by the backend
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
      console.log("Role change response:", data); // Debug log
      
      if (res.ok) {
        fetchUsers();
        // Optional: Show success message
        // alert("User role updated successfully");
      } else {
        alert(data.detail || "Failed to update user role");
      }
    } catch (err) {
      console.error("Role change error:", err);
      alert("Network error while updating role");
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
        return 'bg-warning/10 text-warning border border-warning/30'; // Yellow for pending
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
        <h1 className="text-3xl font-bold gradient-primary text-transparent bg-clip-text">
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
                      className="text-destructive hover:text-destructive/80 ml-2 px-3 py-1.5 rounded-xl hover:bg-destructive/10 transition-colors"
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
    </div>
  );
}