"use client";

import {
  Bell,
  MapPin,
  Volume2,
  Shield,
  HelpCircle,
  ChevronRight,
  Moon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DeliveryNavbar } from '@/components/delivery/DeliveryNavbar';

const settingGroups = [
  {
    title: 'Notifications',
    items: [
      { icon: Bell, label: 'Push Notifications', hasToggle: true, enabled: true },
      { icon: Volume2, label: 'Sound Alerts', hasToggle: true, enabled: true },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: MapPin, label: 'Location Services', hasToggle: true, enabled: true },
      { icon: Moon, label: 'Dark Mode', hasToggle: true, enabled: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help Center', hasArrow: true },
      { icon: Shield, label: 'Privacy Policy', hasArrow: true },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen pb-24">
      <DeliveryNavbar />

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {settingGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              {group.title}
            </h2>
            <div className="rounded-xl bg-card shadow-card overflow-hidden">
              {group.items.map((item, index) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-4 ${index !== group.items.length - 1 ? 'border-b border-border' : ''
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  {item.hasToggle && (
                    <Switch defaultChecked={item.enabled} />
                  )}
                  {item.hasArrow && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-sm text-muted-foreground">
          DeliverPro Driver v1.0.0
        </p>
      </main>
    </div>
  );
}
