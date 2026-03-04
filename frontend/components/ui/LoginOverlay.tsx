"use client";

import { useState } from "react";
import { useAuth } from '@/app/_providers/AuthProvider';

interface LoginOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onLoginSuccess: (data: { token: string; email: string }) => void; // <-- object now
}


export default function LoginOverlay({ isOpen, onClose, onSwitchToSignup, onLoginSuccess }: LoginOverlayProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      onLoginSuccess({ token: '', email });
    } catch (err: any) {
      alert(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-[400px] rounded-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="pt-8 px-8 pb-6">
          <h2 id="login-title" className="text-xl font-bold text-gray-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to your rider account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-[#e4002b] hover:text-[#b91c1c] font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-semibold text-gray-900 hover:text-[#e4002b] transition-colors"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
