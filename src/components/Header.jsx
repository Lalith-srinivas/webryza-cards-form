import React from "react";
import { useFormContext } from "../context/FormContext";
import { Store, ShieldCheck, AlertCircle } from "lucide-react";

export default function Header() {
  const { partnerInfo } = useFormContext();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EEDEB3]/40">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-[#FAF7F2] flex items-center justify-center">
              <span className="font-serif font-bold text-base sm:text-lg text-[#93611D] tracking-tighter">WR</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#25201A]">
                WebRyza
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            </div>
            <p className="text-[9px] sm:text-[10px] tracking-widest uppercase font-semibold text-[#8B6E32]">
              Digital Wedding Invitations
            </p>
          </div>
        </div>

        {/* Partner Attribution Display */}
        <div className="flex justify-end shrink-0">
          {partnerInfo.status === "loading" && (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#FCF9F0] border border-[#EEDEB3] text-[11px] sm:text-xs text-[#8B6E32] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping"></span>
              <span>Verifying...</span>
            </div>
          )}

          {partnerInfo.status === "valid" && (
            <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#FFFDF9] to-[#FCF9F0] border border-[#D4AF37]/50 shadow-sm max-w-[180px] sm:max-w-none">
              <div className="w-5 h-5 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#93611D] shrink-0">
                <Store size={12} className="text-[#93611D]" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-[#93611D] leading-none">
                  Partner
                </p>
                <p className="text-[11px] sm:text-xs font-semibold text-[#25201A] truncate">
                  {partnerInfo.partnerShopName}
                </p>
              </div>
            </div>
          )}

          {partnerInfo.status === "direct" && (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-[#EEDEB3] text-[11px] sm:text-xs font-medium text-[#665C51]">
              <ShieldCheck size={13} className="text-[#93611D]" />
              <span>Direct Registration</span>
            </div>
          )}

          {(partnerInfo.status === "invalid" || partnerInfo.status === "inactive") && (
            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] sm:text-xs text-amber-800">
              <AlertCircle size={12} className="text-amber-600" />
              <span>Direct (Unverified code)</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
