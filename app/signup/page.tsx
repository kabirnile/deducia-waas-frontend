"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Store, Globe, Mail, Lock, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateStore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const storeData = {
      storeName: formData.get("storeName"),
      subDomain: formData.get("subDomain"),
      userEmail: formData.get("email"),
      userPassword: formData.get("password"),
    };

    try {
      const response = await fetch("/api/create-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirects them instantly to their newly created, isolated dashboard
        window.location.href = result.redirectUrl;
      } else {
        setError(result.error || "Failed to create store. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-gray-900 font-sans">
      {/* Left Panel - Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-bold tracking-tighter">
            Deducia.
          </Link>
          <div className="mt-24 max-w-lg">
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
              Bring your local business online, instantly.
            </h1>
            <p className="text-gray-400 text-lg">
              Launch a premium e-commerce storefront in seconds. We handle the infrastructure, hosting, and security. You focus on selling.
            </p>
          </div>
        </div>
        <div className="relative z-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Deducia. Empowering local commerce.
        </div>
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-white opacity-5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Panel - The Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Create your store</h2>
            <p className="text-gray-500 mt-2">Enter your details to generate your dashboard.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateStore} className="space-y-5">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="storeName"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                  placeholder="Store Name (e.g., Aligarh Mart)"
                />
              </div>

              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="subDomain"
                  type="text"
                  required
                  pattern="[a-z0-9]+"
                  title="Only lowercase letters and numbers, no spaces."
                  className="block w-full pl-10 pr-[110px] py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                  placeholder="store-domain"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm font-medium">
                  .deducia.com
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                  placeholder="Admin Email"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                  placeholder="Admin Password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Building Infrastructure...
                </>
              ) : (
                <>
                  Launch Store <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have a store?{" "}
            <Link href="/signin" className="font-semibold text-black hover:underline">
              Sign in to your dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}