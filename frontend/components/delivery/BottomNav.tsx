"use client";

import { Home, User, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/delivery_module', icon: Home, label: 'Dashboard' },
  { href: '/delivery_module/history', icon: History, label: 'History' },
  { href: '/delivery_module/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="glass-card rounded-full px-6 py-3 pointer-events-auto shadow-glow mx-4">
        <div className="flex items-center gap-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300',
                  isActive
                    ? 'text-white bg-primary shadow-lg scale-110'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="sr-only">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
