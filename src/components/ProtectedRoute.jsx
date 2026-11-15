import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { currentUser, partnerProfile, loading } = usePartnerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141210] flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin mb-4" />
        <p className="font-serif text-lg text-[#FAF7F2] font-semibold">WebRyza Partner Portal</p>
        <p className="text-xs text-[#998F81] mt-1">Verifying secure partner session...</p>
      </div>
    );
  }

  if (!currentUser || !partnerProfile) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
