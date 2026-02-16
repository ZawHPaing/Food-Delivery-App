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

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8000/admin/users/");
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
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const deleteUser = async (id: number) => {
    await fetch(`http://localhost:8000/admin/users/${id}`, {
      method: "DELETE",
    });
    fetchUsers();
  };

  const changeRole = async (id: number, role: string) => {
    await fetch(`http://localhost:8000/admin/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_type: role }),
    });
    fetchUsers();
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="flex flex-col space-y-3">
          <a href="#" className="hover:text-primary-foreground font-medium">Dashboard</a>
          <a href="#" className="hover:text-primary-foreground font-medium">Users</a>
          <a href="#" className="hover:text-primary-foreground font-medium">Restaurants</a>
          <a href="#" className="hover:text-primary-foreground font-medium">Orders</a>
          <a href="#" className="hover:text-primary-foreground font-medium">Vouchers</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>

        {/* Filter */}
        <div className="mb-4 flex items-center space-x-4">
          <label className="font-medium">Filter by role:</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-foreground"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="customer">Customer</option>
            <option value="rider">Rider</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{user.id}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.first_name} {user.last_name}</td>
                  <td className="px-6 py-4 capitalize">{user.user_type}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button
                      onClick={() => changeRole(user.id, "admin")}
                      className="px-3 py-1 bg-primary rounded text-white text-sm hover:bg-primary-foreground transition-colors"
                    >
                      Make Admin
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="px-3 py-1 bg-red-500 rounded text-white text-sm hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}