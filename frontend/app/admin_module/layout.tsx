"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCustomerAuth } from "@/app/_providers/CustomerAuthProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user } = useCustomerAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is authorized to view admin pages
    if (!isLoggedIn) {
      router.push("/login?redirect=/admin_module/user_management");
    } else if (user && user.user_type !== "admin") {
      router.push("/consumer_module");
    } else {
      setIsAuthorized(true);
    }
  }, [isLoggedIn, user, router]);

  const navigation = [
    { 
      name: "Users", 
      href: "/admin_module/user_management", 
      icon: (isActive: boolean) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      name: "Menu Management", 
      href: "/admin_module/menu_management", 
      icon: (isActive: boolean) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      name: "Restaurants", 
      href: "/admin_module/restaurants", 
      icon: (isActive: boolean) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      name: "Orders", 
      href: "/admin_module/order_management", 
      icon: (isActive: boolean) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
  ];

  // Show loading while checking authorization
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        <nav className="flex flex-col space-y-2 px-4 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                <span className="flex items-center justify-center w-5 h-5">
                  {item.icon(isActive)}
                </span>
                {isSidebarOpen && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section at bottom */}
        <div className="mt-auto p-4 border-t border-border/30">
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.first_name?.[0] || user?.email?.[0] || 'A'}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Admin User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@example.com'}</p>
              </div>
            )}
          </div>
        </div>
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