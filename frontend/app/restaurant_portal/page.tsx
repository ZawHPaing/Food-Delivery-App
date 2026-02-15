 "use client";

 import { useState } from "react";
 import { useRouter } from "next/navigation";

 export default function RestaurantPortalPage() {
   const router = useRouter();
   const [mode, setMode] = useState<"login" | "register">("register");

   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     router.push("/restaurant_module");
   };

   return (
     <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fffaf0] to-[#f0f4ff] flex items-center justify-center px-4 py-8">
       <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#e4002b] to-[#ff6600] text-white p-10 flex-col justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-4">
              Restaurant Portal
            </h1>
            <p className="text-sm text-white/80">
              For assistance with your restaurant account, contact our admin team.
            </p>
          </div>
          <div className="space-y-3 text-sm mt-8">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70 mb-1">
                Admin contacts
              </p>
              <p className="font-semibold">+95 9 7777 88888</p>
              <p className="font-semibold">+95 9 6666 55555</p>
              <p className="text-white/80 text-xs mt-2">
                Available daily from 9:00 AM to 9:00 PM.
              </p>
            </div>
          </div>
        </div>

         <div className="w-full md:w-1/2 p-8 md:p-10">
           <div className="mb-6 text-center md:text-left">
             <h2 className="text-2xl font-bold text-gray-900 mb-1">
               {mode === "register" ? "Create restaurant account" : "Welcome back"}
             </h2>
             <p className="text-gray-600 text-sm">
               {mode === "register"
                 ? "Join Foodie and start accepting online orders."
                 : "Sign in to manage your restaurant."}
             </p>
           </div>

           <div className="flex mb-6 rounded-lg bg-gray-100 p-1">
             <button
               type="button"
               onClick={() => setMode("register")}
               className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                 mode === "register"
                   ? "bg-white shadow-sm text-[#e4002b]"
                   : "text-gray-500 hover:text-gray-700"
               }`}
             >
               Register
             </button>
             <button
               type="button"
               onClick={() => setMode("login")}
               className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                 mode === "login"
                   ? "bg-white shadow-sm text-[#e4002b]"
                   : "text-gray-500 hover:text-gray-700"
               }`}
             >
               Login
             </button>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
             {mode === "register" && (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Email address
                     </label>
                     <input
                       type="email"
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                       placeholder="restaurant@example.com"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Restaurant brand name
                     </label>
                     <input
                       type="text"
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                       placeholder="La Terrazza"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Password
                     </label>
                     <input
                       type="password"
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                       placeholder="Create a strong password"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Confirm password
                     </label>
                     <input
                       type="password"
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                       placeholder="Confirm your password"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Description
                   </label>
                   <textarea
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                     placeholder="Short description of your restaurant"
                     rows={3}
                   />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Cuisine type
                     </label>
                     <input
                       type="text"
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                       placeholder="Italian, Sushi, Fast food..."
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       City
                     </label>
                     <select
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors bg-white"
                       defaultValue=""
                     >
                       <option value="" disabled>
                         Select city
                       </option>
                       <option value="yangon">Yangon</option>
                       <option value="mandalay">Mandalay</option>
                       <option value="naypyidaw">Naypyidaw</option>
                     </select>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Latitude
                     </label>
                     <input
                       type="text"
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                       placeholder="e.g. 16.8409"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Longitude
                     </label>
                     <input
                       type="text"
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                       placeholder="e.g. 96.1735"
                     />
                   </div>
                 </div>
               </>
             )}

             {mode === "login" && (
               <>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Email address
                   </label>
                   <input
                     type="email"
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                     placeholder="restaurant@example.com"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Password
                   </label>
                   <input
                     type="password"
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e4002b] focus:border-transparent transition-colors"
                     placeholder="Enter your password"
                   />
                 </div>
               </>
             )}

             <button
               type="submit"
               className="w-full bg-gradient-to-r from-[#e4002b] to-[#ff6600] text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-[1.02] mt-4"
             >
               {mode === "register" ? "Register restaurant" : "Login"}
             </button>

             <div className="mt-4 text-center text-sm text-gray-600">
               {mode === "register" ? (
                 <p>
                   Already have an account?{" "}
                   <button
                     type="button"
                     className="text-[#e4002b] hover:text-[#c41e3a] font-semibold transition-colors"
                     onClick={() => setMode("login")}
                   >
                     Login
                   </button>
                 </p>
               ) : (
                 <p>
                   Need to create your restaurant?{" "}
                   <button
                     type="button"
                     className="text-[#e4002b] hover:text-[#c41e3a] font-semibold transition-colors"
                     onClick={() => setMode("register")}
                   >
                     Register
                   </button>
                 </p>
               )}
             </div>
           </form>
         </div>
       </div>
     </div>
   );
 }
