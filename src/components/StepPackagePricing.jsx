import React from "react";
import { useFormContext } from "../context/FormContext";
import { Check, IndianRupee, Sparkles, CheckCircle2, Film, Gift } from "lucide-react";
import { formatINR } from "../utils/formatters";
import VideoStyleSelector from "./VideoStyleSelector";

export default function StepPackagePricing() {
  const { formData, updateField, errors } = useFormContext();

  const commonAmounts = [1500, 2000, 2500, 3000];

  const handleVideoOptionChange = (wantVideo) => {
    if (wantVideo) {
      updateField("videoRequired", true);
      updateField("aiVideoRequired", true);
    } else {
      updateField("videoRequired", false);
      updateField("videoStyle", null);
      updateField("aiVideoRequired", false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Section Header */}
      <div className="border-b border-[#EEDEB3]/50 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
            <Gift size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#25201A]">
              Step 5: Package & Video Selection
            </h2>
            <p className="text-xs text-[#665C51]">
              Review your package pricing and customize your optional wedding invitation video
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Step 5 of 7
        </span>
      </div>

      {/* 1. EXISTING PACKAGE OPTIONS & AMOUNT CHARGED */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#25201A] mb-1">
            Total Amount Charged (₹) <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-[#665C51]">
            Enter the agreed customer package amount, including the digital wedding invitation website and any optional video.
          </p>
        </div>

        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#93611D]">
            <IndianRupee size={18} />
          </div>
          <input
            type="number"
            min="1500"
            step="100"
            placeholder="e.g. 2000"
            value={formData.amountCharged}
            onChange={(e) => updateField("amountCharged", e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-lg font-bold text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all shadow-sm ${
              errors.amountCharged ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
            }`}
          />
        </div>

        {/* Quick Amount Suggestion Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-medium text-[#8B6E32]">Quick select:</span>
          {commonAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => updateField("amountCharged", amt.toString())}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                formData.amountCharged === amt.toString()
                  ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-xs"
                  : "bg-white text-[#25201A] border-[#EEDEB3] hover:bg-[#FAF0D7] hover:border-[#D4AF37]"
              }`}
            >
              {formatINR(amt)}
            </button>
          ))}
        </div>

        {errors.amountCharged && (
          <p className="text-xs text-rose-600 font-medium">{errors.amountCharged}</p>
        )}

        {/* Informational Package Inclusions Card */}
        <div className="p-4 rounded-2xl bg-[#FCF9F0] border border-[#EEDEB3]/80 space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-[#93611D] uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Package Inclusions at {formatINR(formData.amountCharged || 1500)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-[#665C51]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={14} className="text-[#93611D] shrink-0" />
              <span>Personalised Wedding Webpage</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={14} className="text-[#93611D] shrink-0" />
              <span>Google Maps Venue Navigation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={14} className="text-[#93611D] shrink-0" />
              <span>Dynamic Wedding Events Schedule</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={14} className="text-[#93611D] shrink-0" />
              <span>{formData.videoRequired ? "Wedding Video Invitation (Included)" : "Mobile-First Luxury Layout"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NEW SECTION: WEDDING INVITATION VIDEO SELECTION */}
      <div className="pt-2 border-t border-[#EEDEB3]/60 space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <Film size={18} className="text-[#93611D]" />
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#25201A]">
              Would you like a Wedding Invitation Video?
            </h3>
          </div>
          <p className="text-xs text-[#665C51] mt-1">
            An optional cinema-grade invitation video reel styled to match your wedding aesthetic.
          </p>
        </div>

        {/* Option 1 & Option 2 Selection Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Option 1: YES */}
          <button
            type="button"
            onClick={() => handleVideoOptionChange(true)}
            className={`relative p-4 rounded-2xl border text-left transition-all flex items-start space-x-3.5 cursor-pointer ${
              formData.videoRequired
                ? "bg-[#FCF9F0] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md"
                : "bg-white/80 border-[#EEDEB3] hover:border-[#D4AF37]/50 hover:bg-white"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                formData.videoRequired
                  ? "bg-[#D4AF37] text-white shadow-xs"
                  : "border-2 border-[#D8CDBF] text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-base sm:text-lg font-bold text-[#25201A]">
                  Yes, I want a wedding video
                </span>
              </div>
              <p className="text-xs text-[#665C51] mt-1">
                Choose from 4 cinema-grade video styles. Included in your package.
              </p>
              {formData.videoRequired && formData.videoStyle && (
                <div className="mt-2 inline-flex items-center space-x-1 text-[11px] font-bold text-[#93611D] bg-[#FAF0D7] px-2.5 py-0.5 rounded-full border border-[#EEDEB3]">
                  <span>Style: {formData.videoStyle}</span>
                </div>
              )}
            </div>
          </button>

          {/* Option 2: NO */}
          <button
            type="button"
            onClick={() => handleVideoOptionChange(false)}
            className={`relative p-4 rounded-2xl border text-left transition-all flex items-start space-x-3.5 cursor-pointer ${
              !formData.videoRequired
                ? "bg-[#FCF9F0] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md"
                : "bg-white/80 border-[#EEDEB3] hover:border-[#D4AF37]/50 hover:bg-white"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                !formData.videoRequired
                  ? "bg-[#D4AF37] text-white shadow-xs"
                  : "border-2 border-[#D8CDBF] text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-base sm:text-lg font-bold text-[#25201A]">
                  No, just the wedding website
                </span>
              </div>
              <p className="text-xs text-[#665C51] mt-1">
                Digital wedding invitation website only. No video required.
              </p>
            </div>
          </button>
        </div>

        {/* Dynamic Video Styles Display: Appears ONLY when Option 1 (Yes) is chosen */}
        {formData.videoRequired && (
          <div className="mt-6 animate-fadeIn">
            <VideoStyleSelector
              selectedStyle={formData.videoStyle}
              onSelectStyle={(styleName) => updateField("videoStyle", styleName)}
              onClearStyle={() => updateField("videoStyle", null)}
              error={errors.videoStyle}
            />
          </div>
        )}
      </div>
    </div>
  );
}
