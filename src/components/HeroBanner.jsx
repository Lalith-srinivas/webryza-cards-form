import React from "react";
import { useFormContext } from "../context/FormContext";
import { AlertCircle, Sparkles, Heart } from "lucide-react";

export default function HeroBanner() {
  const { partnerInfo } = useFormContext();

  return (
    <div className="relative pt-6 pb-4 sm:pt-10 sm:pb-6 text-center max-w-3xl mx-auto px-4">
      {/* Decorative floral or sparkle accent */}
      <div className="flex items-center justify-center space-x-2 text-[#C9972C] mb-2 opacity-80">
        <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]"></span>
        <Sparkles size={14} className="text-[#C9972C]" />
        <Heart size={14} className="text-[#D4AF37] fill-[#D4AF37]/20" />
        <Sparkles size={14} className="text-[#C9972C]" />
        <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]"></span>
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#25201A] leading-tight">
        Your Wedding, <span className="gold-gradient-text italic">Beautifully Invited.</span>
      </h1>

      <p className="mt-3 text-sm sm:text-base text-[#665C51] max-w-xl mx-auto leading-relaxed">
        Share your wedding moments with a beautiful digital invitation. Tell us your details and we&apos;ll create your personalised wedding website.
      </p>

      {/* Inactive or Invalid Partner Alert Notification */}
      {partnerInfo.status === "inactive" && (
        <div className="mt-4 p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-left max-w-lg mx-auto flex items-start space-x-2.5 shadow-sm">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-normal">
            <span className="font-semibold block text-amber-950">Notice: Partner Link Inactive</span>
            {partnerInfo.message}
          </div>
        </div>
      )}

      {partnerInfo.status === "invalid" && (
        <div className="mt-4 p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-left max-w-lg mx-auto flex items-start space-x-2.5 shadow-sm">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-normal">
            <span className="font-semibold block text-amber-950">Direct Registration</span>
            {partnerInfo.message}
          </div>
        </div>
      )}
    </div>
  );
}
