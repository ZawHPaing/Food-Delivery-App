"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/app/_providers/CustomerAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "./AuthLayout";

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoggedIn } = useCustomerAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        user_type: "customer",
      });
      router.push("/consumer_module");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    router.replace("/consumer_module");
    return null;
  }

  return (
    <AuthLayout linkHref="/login" linkLabel="Sign in">
      <div className="w-full max-w-[380px] max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-hide">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200/80 p-8">
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
            Create account
          </h1>
          <p className="text-neutral-500 text-sm mt-1 mb-5">
            Join Foodie to order from the best restaurants
          </p>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="reg-first-name"
                  className="text-neutral-700 text-sm font-medium"
                >
                  First name
                </Label>
                <Input
                  id="reg-first-name"
                  name="first_name"
                  type="text"
                  placeholder="John"
                  value={form.first_name}
                  onChange={handleChange}
                  className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="reg-last-name"
                  className="text-neutral-700 text-sm font-medium"
                >
                  Last name
                </Label>
                <Input
                  id="reg-last-name"
                  name="last_name"
                  type="text"
                  placeholder="Doe"
                  value={form.last_name}
                  onChange={handleChange}
                  className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="reg-email"
                className="text-neutral-700 text-sm font-medium"
              >
                Email
              </Label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="reg-phone"
                className="text-neutral-700 text-sm font-medium"
              >
                Phone
              </Label>
              <Input
                id="reg-phone"
                name="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={form.phone}
                onChange={handleChange}
                className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                required
                autoComplete="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="reg-password"
                className="text-neutral-700 text-sm font-medium"
              >
                Password
              </Label>
              <Input
                id="reg-password"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-[#e4002b] hover:bg-[#c40026] text-white font-medium text-sm mt-1"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-neutral-500 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#e4002b] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
