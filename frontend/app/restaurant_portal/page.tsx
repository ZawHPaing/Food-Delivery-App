"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RestaurantPortalPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/restaurant_module");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50">
      <header className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-neutral-200/80 bg-white">
        <Link
          href="/consumer_module"
          className="flex items-center gap-2 text-neutral-900 no-underline"
        >
          <div className="h-8 w-8 rounded-lg bg-[#e4002b] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">F</span>
          </div>
          <span className="font-semibold text-neutral-900 tracking-tight">
            Foodie
          </span>
        </Link>
        <span className="text-sm text-neutral-500 font-medium">
          Restaurant Portal
        </span>
      </header>

      <main className="flex-1 min-h-0 flex items-center justify-center overflow-hidden px-4 py-6">
        <div className="w-full max-w-[440px] max-h-full overflow-y-auto scrollbar-hide">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200/80 p-8">
            <div className="flex rounded-lg bg-neutral-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  mode === "register"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  mode === "login"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Login
              </button>
            </div>

            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
              {mode === "register"
                ? "Create restaurant account"
                : "Welcome back"}
            </h1>
            <p className="text-neutral-500 text-sm mt-1 mb-6">
              {mode === "register"
                ? "Join Foodie and start accepting orders."
                : "Sign in to manage your restaurant."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rest-email"
                        className="text-neutral-700 text-sm font-medium"
                      >
                        Email
                      </Label>
                      <Input
                        id="rest-email"
                        type="email"
                        placeholder="restaurant@example.com"
                        className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rest-name"
                        className="text-neutral-700 text-sm font-medium"
                      >
                        Restaurant name
                      </Label>
                      <Input
                        id="rest-name"
                        type="text"
                        placeholder="e.g. La Terrazza"
                        className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rest-password"
                        className="text-neutral-700 text-sm font-medium"
                      >
                        Password
                      </Label>
                      <Input
                        id="rest-password"
                        type="password"
                        placeholder="Min 6 characters"
                        className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rest-confirm"
                        className="text-neutral-700 text-sm font-medium"
                      >
                        Confirm password
                      </Label>
                      <Input
                        id="rest-confirm"
                        type="password"
                        placeholder="Repeat password"
                        className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="rest-desc"
                      className="text-neutral-700 text-sm font-medium"
                    >
                      Description
                    </Label>
                    <textarea
                      id="rest-desc"
                      placeholder="Short description of your restaurant"
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e4002b] focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rest-cuisine"
                        className="text-neutral-700 text-sm font-medium"
                      >
                        Cuisine type
                      </Label>
                      <Input
                        id="rest-cuisine"
                        type="text"
                        placeholder="Italian, Sushi..."
                        className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rest-city"
                        className="text-neutral-700 text-sm font-medium"
                      >
                        City
                      </Label>
                      <select
                        id="rest-city"
                        className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#e4002b] focus:border-transparent"
                      >
                        <option value="">Select city</option>
                        <option value="yangon">Yangon</option>
                        <option value="mandalay">Mandalay</option>
                        <option value="naypyidaw">Naypyidaw</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rest-lat"
                        className="text-neutral-700 text-sm font-medium"
                      >
                        Latitude
                      </Label>
                      <Input
                        id="rest-lat"
                        type="text"
                        placeholder="e.g. 16.8409"
                        className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="rest-lng"
                        className="text-neutral-700 text-sm font-medium"
                      >
                        Longitude
                      </Label>
                      <Input
                        id="rest-lng"
                        type="text"
                        placeholder="e.g. 96.1735"
                        className="h-9 border-neutral-200 focus-visible:ring-[#e4002b]"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === "login" && (
                <>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="rest-login-email"
                      className="text-neutral-700 text-sm font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="rest-login-email"
                      type="email"
                      placeholder="restaurant@example.com"
                      className="h-10 border-neutral-200 focus-visible:ring-[#e4002b]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="rest-login-password"
                      className="text-neutral-700 text-sm font-medium"
                    >
                      Password
                    </Label>
                    <Input
                      id="rest-login-password"
                      type="password"
                      placeholder="Enter your password"
                      className="h-10 border-neutral-200 focus-visible:ring-[#e4002b]"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-[#e4002b] hover:bg-[#c40026] text-white font-medium text-sm mt-2"
              >
                {mode === "register" ? "Create account" : "Sign in"}
              </Button>

              <p className="text-center text-neutral-500 text-sm pt-1">
                {mode === "register" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-medium text-[#e4002b] hover:underline"
                      onClick={() => setMode("login")}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Need an account?{" "}
                    <button
                      type="button"
                      className="font-medium text-[#e4002b] hover:underline"
                      onClick={() => setMode("register")}
                    >
                      Register
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>

          <p className="mt-6 text-center text-neutral-400 text-xs">
            For help with your restaurant account, contact admin: +95 9 7777 88888
          </p>
        </div>
      </main>
    </div>
  );
}
