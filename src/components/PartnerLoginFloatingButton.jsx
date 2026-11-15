import React from "react";
import { Link } from "react-router-dom";
import { Store, ChevronRight } from "lucide-react";

export default function PartnerLoginFloatingButton() {
  return (
    <Link
      to="/admin/login"
      aria-label="Open Partner Login"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center space-x-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#1F1B16] text-[#FAF7F2] border border-[#D4AF37]/50 shadow-lg hover:shadow-xl hover:border-[#D4AF37] hover:scale-105 active:scale-95 transition-all duration-200 group"
    >
      <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#E6CA65] group-hover:bg-[#D4AF37] group-hover:text-[#1F1B16] transition-colors">
        <Store size={12} />
      </div>
      <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#FAF7F2]">
        Partner Login
      </span>
      <ChevronRight
        size={14}
        className="text-[#D4AF37] group-hover:translate-x-0.5 transition-transform"
      />
    </Link>
  );
}
