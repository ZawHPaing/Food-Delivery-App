"use client";

import { useEffect } from 'react';
import { BottomNav } from '@/components/delivery/BottomNav';
import { usePathname } from 'next/navigation';

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
    
    document.body.classList.remove('dark');
    document.body.classList.add('light');

    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'light');
    
    return () => {
    };
  }, []);

  return (
    <div className="min-h-screen bg-background light" style={{ colorScheme: 'light' }}>
      {children}
      {!pathname?.startsWith('/delivery_module/landing') && <BottomNav />}
    </div>
  );
}
