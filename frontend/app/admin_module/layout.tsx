"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigation = [
    { name: "Dashboard", href: "/admin_module/dashboard", icon: "📊" },
    { name: "Users", href: "/admin_module/user_management", icon: "👥" },
    { name: "Menu Management", href: "/admin_module/menu_management", icon: "📋" },
    { name: "Restaurants", href: "/admin_module/restaurants", icon: "🏪" },
    { name: "Orders", href: "/admin_module/orders", icon: "🛵" },
    { name: "Vouchers", href: "/admin_module/vouchers", icon: "🎫" },
  ];

  return (
    <div className="min-h-screen flex bg-bg-light text-foreground">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} glass-card transition-all duration-300 flex flex-col m-4 rounded-2xl`}>
        <div className="p-6 flex items-center justify-between border-b border-border/30">
          <h2 className={`text-xl font-bold gradient-primary text-transparent bg-clip-text ${!isSidebarOpen && 'hidden'}`}>
            Admin Panel
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="flex flex-col space-y-2 px-4 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'gradient-primary text-primary-foreground shadow-glow' 
                    : 'hover:bg-muted text-foreground/70 hover:text-foreground'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        <div className="glass-card p-6 min-h-full rounded-2xl animate-enter">
          {children}
        </div>
      </main>
    </div>
  );
}