"use client"
import { useState } from "react";

export default function TestBuildPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "",
    subDomain: "",
    userEmail: "",
    userPassword: ""
  });

  const handleCreateStore = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This calls the API route we built earlier
      const res = await fetch('/api/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.success) {
        alert("Store built successfully! Redirecting to Odoo Dashboard...");
        window.location.href = data.redirectUrl;
      } else {
        alert("Failed to build: " + data.error);
      }
    } catch (err) {
      alert("Network error.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">
      <form onSubmit={handleCreateStore} className="p-8 bg-white rounded-lg shadow-xl w-96 flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-4">WaaS Engine Test</h2>
        
        <input required placeholder="Store Name (e.g., Sharma Sweets)" className="border p-2 rounded" 
          onChange={e => setFormData({...formData, storeName: e.target.value})} />
          
        <input required placeholder="Subdomain (e.g., sharmasweets)" className="border p-2 rounded" 
          onChange={e => setFormData({...formData, subDomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} />
          
        <input required type="email" placeholder="Owner Email" className="border p-2 rounded" 
          onChange={e => setFormData({...formData, userEmail: e.target.value})} />
          
        <input required type="password" placeholder="Owner Password" className="border p-2 rounded" 
          onChange={e => setFormData({...formData, userPassword: e.target.value})} />

        <button disabled={loading} type="submit" className="bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? "Building Store in Odoo..." : "Trigger Auto-Build"}
        </button>
      </form>
    </div>
  );
}