"use client"
import { useState } from "react";
// Import any UI components from your v0 design here

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  // THIS IS THE BRAIN
  const handleCreateStore = async (event: any) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const storeData = {
      storeName: formData.get('storeName'),
      subDomain: formData.get('subDomain'),
      userEmail: formData.get('email'),
      userPassword: formData.get('password'),
    };

    try {
      const response = await fetch('/api/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirects instantly to their live Odoo dashboard
        window.location.href = result.redirectUrl; 
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      
      {/* THIS IS YOUR v0.app FORM BODY */}
      {/* Just make sure your <form> tag has onSubmit={handleCreateStore} */}
      
      <form onSubmit={handleCreateStore} className="flex flex-col gap-4 p-8 bg-white shadow-lg rounded">
        <h2 className="text-2xl font-bold">Start Your Free Trial</h2>
        
        {/* Make sure your inputs have the correct 'name' attributes! */}
        <input name="storeName" required placeholder="Shop Name" className="border p-2" />
        <input name="subDomain" required placeholder="Subdomain (e.g. sharma)" className="border p-2" />
        <input name="email" type="email" required placeholder="Email" className="border p-2" />
        <input name="password" type="password" required placeholder="Password" className="border p-2" />
        
        <button disabled={loading} type="submit" className="bg-blue-600 text-white p-2 rounded">
          {loading ? "Building Your Store..." : "Launch Store"}
        </button>
      </form>

    </div>
  );
}