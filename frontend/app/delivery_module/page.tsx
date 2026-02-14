"use client";

import { useDeliveryState } from '@/hooks/useDeliveryState';
import { StatusToggle } from '@/components/delivery/StatusToggle';
import { IncomingRequest } from '@/components/delivery/IncomingRequest';
import { ActiveOrderCard } from '@/components/delivery/ActiveOrderCard';
import { MapPlaceholder } from '@/components/delivery/MapPlaceholder';
import { Package, Bike, Map as MapIcon, ChevronUp, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginOverlay from '@/components/ui/LoginOverlay';
import SignupOverlay from '@/components/ui/SignupOverlay';
import { useAuth } from '@/app/_providers/AuthProvider';

export default function Dashboard() {
  const {
    status,
    incomingRequests,
    activeOrder,
    messages,
    toggleOnline,
    acceptOrder,
    declineOrder,
    arrivedAtShop,
    pickupOrder,
    completeOrder,
    sendMessage,
  } = useDeliveryState();

  const [showMap, setShowMap] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { isLoggedIn, loginMock, logout } = useAuth();

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50">
      {/* Header */}
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
                <p className="text-xs text-muted-foreground font-medium">Driver Console</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isLoggedIn ? (
                <>
                  <Button variant="ghost" onClick={() => setShowLogin(true)} className="rounded-xl">
                    Log in
                  </Button>
                  <Button onClick={() => setShowSignup(true)} className="rounded-xl bg-gradient-to-r from-[#e4002b] to-[#ff6600] border-none">
                    Sign up
                  </Button>
                </>
              ) : (
                <Button variant="ghost" onClick={logout} className="rounded-xl">
                  Log out
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Fixed area for Toggle and Map */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full relative">
        <div className="p-4 space-y-4">
          {/* Status Toggle */}
          <StatusToggle status={status} onToggle={toggleOnline} />

          {/* Map View */}
          <div className="animate-enter" style={{ animationDelay: '0.1s' }}>
            <MapPlaceholder />
          </div>
        </div>

        {/* Draggable Requests Sheet */}
        <motion.div
          initial={{ y: '60%' }}
          animate={{ y: activeOrder || incomingRequests.length > 0 ? '0%' : '60%' }}
          drag="y"
          dragConstraints={{ top: -300, bottom: 0 }}
          dragElastic={0.1}
          className="absolute left-0 right-0 z-40 bg-white rounded-t-[3rem] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] border-t border-border/50 flex flex-col"
          style={{ 
            top: '420px', 
            height: 'calc(100vh - 120px)',
            touchAction: 'none' 
          }}
        >
          {/* Drag Handle */}
          <div className="w-full flex flex-col items-center py-4 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-muted rounded-full mb-2" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <GripHorizontal className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {activeOrder ? 'Current Order' : `Requests (${incomingRequests.length})`}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-6">
            {/* Active Order */}
            {activeOrder && (
              <section className="animate-enter">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-lg font-bold text-foreground">Current Order</h2>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Order #{activeOrder.id.slice(-4)}
                  </span>
                </div>
                <ActiveOrderCard
                  order={activeOrder}
                  messages={messages}
                  onArrivedAtShop={arrivedAtShop}
                  onPickedUp={pickupOrder}
                  onComplete={completeOrder}
                  onSendMessage={sendMessage}
                />
              </section>
            )}

            {/* Incoming Requests */}
            {!activeOrder && incomingRequests.length > 0 && (
              <section className="space-y-4 animate-enter">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-bold text-foreground">
                    New Requests <span className="text-primary">({incomingRequests.length})</span>
                  </h2>
                </div>
                <div className="space-y-4">
                  {incomingRequests.map((request, index) => (
                    <IncomingRequest
                      key={request.id}
                      request={request}
                      queuePosition={index + 1}
                      onAccept={() => acceptOrder(request)}
                      onDecline={() => declineOrder(request.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {!activeOrder && incomingRequests.length === 0 && status === 'online' && (
              <section className="py-12 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
                  <div className="relative w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-white shadow-sm">
                    <Package className="w-10 h-10 text-primary animate-bounce" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Scanning for orders...
                </h3>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                  New requests will appear here as soon as they are available.
                </p>
              </section>
            )}

            {/* Unavailable State */}
            {status === 'offline' && (
              <section className="py-12 text-center opacity-60">
                <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto mb-6 flex items-center justify-center">
                  <Bike className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Unavailable
                </h3>
                <p className="text-sm text-muted-foreground">
                  Turn on your availability to start working.
                </p>
              </section>
            )}
          </div>
        </motion.div>
      </main>
      {/* Auth Modals */}
      <LoginOverlay
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
        onLoginSuccess={() => {
          loginMock();
          setShowLogin(false);
        }}
      />
      <SignupOverlay
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}
