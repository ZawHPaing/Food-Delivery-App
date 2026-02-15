"use client";

import { Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/_providers/AuthProvider";
import { useRouter } from "next/navigation";

interface DeliveryNavbarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function DeliveryNavbar({ onLoginClick, onSignupClick }: DeliveryNavbarProps) {
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
    } finally {
      router.push("/delivery_module/landing?login=1");
    }
  };

  return (
    <header className="z-50 bg-white border-b border-border/50">
      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl gradient-primary shadow-glow">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-500">
                DeliverPro
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Driver Console
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  onClick={onLoginClick}
                  className="rounded-xl"
                >
                  Log in
                </Button>
                <Button
                  onClick={onSignupClick}
                  className="rounded-xl bg-gradient-to-r from-[#e4002b] to-[#ff6600] border-none"
                >
                  Sign up
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="rounded-xl"
              >
                Log out
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
