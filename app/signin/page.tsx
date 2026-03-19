"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";

export default function SigninPage() {
  const [subdomain, setSubdomain] = useState("");

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subdomain) return;
    
    // Clean input: lowercase only, strip special characters and spaces
    const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Route them strictly to their isolated container
    window.location.href = `https://${cleanSubdomain}.deducia.com/web/login`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-8 left-8">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-black">
          Deducia.
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Enter your store's subdomain to access your admin dashboard.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          <div className="space-y-2">
            <label htmlFor="subdomain" className="block text-sm font-semibold text-gray-700">
              Store Subdomain
            </label>
            <div className="relative flex items-center group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-black">
                <Globe className="h-5 w-5 text-gray-400 group-focus-within:text-black" />
              </div>
              <input
                id="subdomain"
                name="subdomain"
                type="text"
                required
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="block w-full pl-10 pr-[110px] py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                placeholder="your-store"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 text-sm font-medium bg-gray-50 border-l border-gray-200 rounded-r-xl">
                .deducia.com
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all"
          >
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have a store yet?{" "}
            <Link href="/signup" className="font-semibold text-black hover:underline">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}