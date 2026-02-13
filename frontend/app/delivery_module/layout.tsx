"use client";

import { useEffect } from 'react';
import { BottomNav } from '@/components/delivery/BottomNav';

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Force light mode on html and body elements
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
    
    document.body.classList.remove('dark');
    document.body.classList.add('light');

    // Ensure meta tag for color-scheme exists
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'light');
    
    // Cleanup if needed
    return () => {
    };
  }, []);

  return (
    <div className="min-h-screen bg-background light" style={{ colorScheme: 'light' }}>
      {children}
      <BottomNav />
    </div>
  );
}
