"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, CheckCircle2, MapPin, Smartphone, Bike, User, DollarSign, Clock, Gift } from "lucide-react";
import LoginOverlay from "@/components/ui/LoginOverlay";
import SignupOverlay from "@/components/ui/SignupOverlay";
import { useAuth } from "@/app/_providers/AuthProvider";

export default function DeliveryLandingPage() {
  const [city, setCity] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [is18, setIs18] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { isLoggedIn, login, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showExtendedForm = city !== "" && vehicle !== "";

  useEffect(() => {
    if (searchParams.get("login") === "1") {
      setShowLogin(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <Link href="/consumer_module" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#e4002b] to-[#ff6600] flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Foodie</span>
          </Link>
          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 shadow-sm"
                >
                  Log in
                </button>
                {/* <button
                  onClick={() => setShowSignup(true)}
                  className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white px-5 py-2 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-orange-200 active:scale-95 transition-all"
                >
                  Sign up
                </button> */}
              </>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch {
                  } finally {
                    setShowLogin(true);
                  }
                }}
                className="text-sm font-semibold text-gray-600 hover:text-[#e4002b] transition-colors"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white pointer-events-none" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-amber-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-[350px] h-[350px] bg-rose-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-700 mb-6 text-xs font-semibold uppercase tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Join 10,000+ riders
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-[1.15] tracking-tight text-gray-900">
                Become a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e4002b] to-[#f97316]">Rider</span>
                <br className="hidden sm:block" />& start earning
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
                Choose your own hours, explore your city, and get paid weekly. Everything you need is in your pocket.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6">
                {[
                  { Icon: Clock, label: "Flexible Hours", color: "text-amber-600 bg-amber-50 border-amber-100" },
                  { Icon: DollarSign, label: "Weekly Payouts", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                  { Icon: Gift, label: "Rider Bonuses", color: "text-rose-600 bg-rose-50 border-rose-100" },
                ].map(({ Icon, label, color }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 ${color}`}
                  >
                    <div className="p-2 rounded-xl bg-white/80">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Form Card */}
            <div className="w-full max-w-[420px] shrink-0">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden transition-shadow hover:shadow-2xl hover:shadow-gray-200/50 duration-300">
                <div className="bg-gradient-to-r from-[#e4002b] via-[#ea1a3a] to-[#f97316] px-8 py-7 text-center text-white">
                  <h3 className="text-xl font-bold tracking-tight">Apply now</h3>
                  <p className="text-white/90 text-sm mt-1">Fill in your details to get started</p>
                </div>
                <form className="p-6 sm:p-8 space-y-5" onSubmit={async (e) => {
                  e.preventDefault();
                  setMessage(null);
                  if (!agreed) { setMessage('You must agree to terms.'); return; }
                  if (is18 !== true) { setMessage('You must be 18 or older to apply.'); return; }
                  setLoading(true);
                  try {
                    const body = {
                      first_name: name,
                      last_name: lastName,
                      email,
                      phone,
                      password,
                      city,
                      vehicle,
                      license_plate: licensePlate
                    };
                    const res = await fetch('http://localhost:8000/delivery/sign_up', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(body)
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setMessage(data?.error || JSON.stringify(data));
                    } else {
                      setMessage('Signup successful!');
                      const token = data?.access_token || data?.accessToken || data?.token;
                      try { if (token) localStorage.setItem('access_token', token); } catch (e) {}
                      try { await login(email, password); } catch (e) {}
                      setShowSignup(false);
                      try { router.push('/delivery_module/profile'); } catch (e) {}
                    }
                  } catch (err: any) {
                    setMessage(err.message || String(err));
                  } finally { setLoading(false); }
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        City
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#e4002b] transition-colors pointer-events-none z-10" />
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium outline-none transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 appearance-none cursor-pointer"
                        >
                          <option value="">Where will you deliver?</option>
                          <option value="yangon">Yangon</option>
                          <option value="mandalay">Mandalay</option>
                          <option value="naypyidaw">Naypyidaw</option>
                        </select>
                        <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        Vehicle type
                      </label>
                      <div className="relative group">
                        <Bike className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#e4002b] transition-colors pointer-events-none z-10" />
                        <select
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                          className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium outline-none transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20 appearance-none cursor-pointer"
                        >
                          <option value="">Choose your vehicle</option>
                          <option value="bicycle">Bicycle</option>
                          <option value="motorbike">Motorbike</option>
                          <option value="car">Car</option>
                        </select>
                        <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    {showExtendedForm && (
                      <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="First name"
                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Last name"
                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>

                        <input
                          type="email"
                          placeholder="Email"
                          className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                          type="password"
                          placeholder="Password"
                          className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />

                        <input
                          type="text"
                          placeholder="License plate"
                          className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                        />

                        <div className="flex gap-2">
                          <div className="w-20 px-3 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-500 flex items-center justify-center shrink-0">
                            +95
                          </div>
                          <input
                            type="tel"
                            placeholder="Phone"
                            className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:border-[#e4002b] focus:ring-2 focus:ring-[#e4002b]/20"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>

                        <div className="space-y-3 py-2">
                          <p className="text-sm font-bold text-gray-700">Are you at least 18 years old?</p>
                          <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${is18 === true ? 'border-[#e4002b] bg-[#e4002b]' : 'border-gray-300 group-hover:border-[#e4002b]'}`}>
                                {is18 === true && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <input type="radio" className="hidden" name="age" onChange={() => setIs18(true)} />
                              <span className="text-sm font-medium text-gray-600">Yes, I am</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${is18 === false ? 'border-[#e4002b] bg-[#e4002b]' : 'border-gray-300 group-hover:border-[#e4002b]'}`}>
                                {is18 === false && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <input type="radio" className="hidden" name="age" onChange={() => setIs18(false)} />
                              <span className="text-sm font-medium text-gray-600">No, I'm not</span>
                            </label>
                          </div>
                        </div>

                        <label className="flex gap-3 cursor-pointer group pt-2">
                          <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${agreed ? 'border-[#e4002b] bg-[#e4002b]' : 'border-gray-300 group-hover:border-[#e4002b]'}`}>
                            {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={agreed} onChange={() => setAgreed(!agreed)} />
                          <span className="text-[11px] text-gray-500 leading-snug">
                            I agree to the processing of my personal data in accordance with the Privacy Policy and Terms of Use. I understand my data will be used for recruitment purposes.
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold text-center hover:bg-gray-800 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                    disabled={loading}
                  >
                    {loading ? "Submitting…" : "Submit application"}
                  </button>

                  {message && (
                    <p className="text-center text-sm text-gray-600 mt-2">{message}</p>
                  )}

                  <p className="text-center text-xs text-gray-400 leading-relaxed">
                    By continuing, you agree to our Terms of Service and Privacy Policy. Must be 18+.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why ride with Foodie?</h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-[#e4002b] to-[#ff6600] mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-[#ff6600]" />
              </div>
              <h4 className="text-xl font-bold mb-4">Work on your terms</h4>
              <p className="text-gray-600 leading-relaxed">
                Be your own boss. Work when you want, where you want. 
                Full-time or part-time, it's completely up to you.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="w-8 h-8 text-[#e4002b]" />
              </div>
              <h4 className="text-xl font-bold mb-4">Earn more money</h4>
              <p className="text-gray-600 leading-relaxed">
                Competitive pay per delivery plus 100% of your tips. 
                Higher earnings during peak hours and special bonuses.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8 text-[#ff6600]" />
              </div>
              <h4 className="text-xl font-bold mb-4">Easy to use app</h4>
              <p className="text-gray-600 leading-relaxed">
                Our world-class app guides you every step of the way. 
                From pickup to drop-off, we've got you covered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements List */}
      <section className="py-24">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#e4002b] to-[#ff6600] rounded-[3rem] p-12 md:p-16 text-white relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-64 h-64 bg-white/10 rounded-full" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-10">What you'll need</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  "A smartphone (iOS or Android)",
                  "Valid ID or Passport",
                  "Your own vehicle (Bike, Scooter, or Car)",
                  "Be at least 18 years old",
                  "Valid driving license (for motor vehicles)",
                  "Proof of residence"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-orange-200" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background Decorations matching the user's reference image */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#e4002b]/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Meet Our Riders</h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-[#e4002b] to-[#ff6600] mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Testimonial 1 */}
            <div className="flex flex-col items-center text-center space-y-6 p-10 rounded-[3.5rem] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 hover:scale-[1.02] transition-transform duration-300">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Htain" 
                    alt="Htain Lin"
                    className="w-full h-full object-cover bg-orange-50"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#e4002b] to-[#ff6600] p-2 rounded-full text-white shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Htain Lin</h4>
                <p className="text-[#ff6600] font-semibold text-sm">Delivery Partner</p>
              </div>
              <p className="text-gray-600 italic leading-relaxed text-lg">
                "Working with Foodie is incredibly free and enjoyable. Even though we aren't related, the entire team treats each other like a close-knit family. Managing my own schedule allows me to pursue my studies while earning a stable income. It's been a perfect fit for my lifestyle."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="flex flex-col items-center text-center space-y-6 p-10 rounded-[3.5rem] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 hover:scale-[1.02] transition-transform duration-300">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=EiEi" 
                    alt="Ei Ei Khaing"
                    className="w-full h-full object-cover bg-red-50"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#e4002b] to-[#ff6600] p-2 rounded-full text-white shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Ei Ei Khaing</h4>
                <p className="text-[#ff6600] font-semibold text-sm">Delivery Partner</p>
              </div>
              <p className="text-gray-600 italic leading-relaxed text-lg">
                "I love the flexibility here. Whether I want to work part-time or a full day, I can choose what suits me best. The harder you work, the more you earn, which is very motivating. Plus, I get to explore different parts of the city and meet new people every day."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e4002b] to-[#ff6600] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-xl font-bold">Foodie</span>
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                Empowering riders and local businesses across the nation. 
                Join our community and start your journey today.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6">Company</h5>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Safety</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Newsroom</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6">Social</h5>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Facebook</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Twitter</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2026 Foodie Delivery. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-white">Privacy Policy</Link>
              <Link href="#" className="hover:text-white">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
      {/* Auth Modals */}
<LoginOverlay
  isOpen={showLogin}
  onClose={() => setShowLogin(false)}
  onSwitchToSignup={() => {
    setShowLogin(false);
    setShowSignup(true);
  }}
onLoginSuccess={(data: { token: string; email: string }) => {
  setShowLogin(false);
  router.push('/delivery_module/profile');
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
