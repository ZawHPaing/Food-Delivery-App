"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerAuth } from "@/app/_providers/CustomerAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "./AuthLayout";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/consumer_module";
  const { login, isLoggedIn } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect.startsWith("/") ? redirect : "/consumer_module");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      router.replace(redirect.startsWith("/") ? redirect : "/consumer_module");
    }
  }, [isLoggedIn, redirect, router]);

  if (isLoggedIn) {
    return null;
  }

  return (
    <AuthLayout linkHref="/register" linkLabel="Create account">
      <div className="w-full max-w-[380px]">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/80 p-8">
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-neutral-500 text-sm mt-1 mb-6">
            Sign in to continue to Foodie
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label
                htmlFor="login-email"
                className="text-neutral-700 text-sm font-medium"
              >
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 border-neutral-200 focus-visible:ring-[#e4002b]"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="login-password"
                className="text-neutral-700 text-sm font-medium"
              >
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 border-neutral-200 focus-visible:ring-[#e4002b]"
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-[#e4002b] hover:bg-[#c40026] text-white font-medium text-sm"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-neutral-500 text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[#e4002b] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
