import React from "react";
import { useFormContext } from "../context/FormContext";
import { Video, Check, IndianRupee, Sparkles, CheckCircle2 } from "lucide-react";
import { formatINR } from "../utils/formatters";

export default function StepPackagePricing() {
  const { formData, updateField, errors } = useFormContext();

  const commonAmounts = [1500, 2000, 2500, 3000];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Section Header */}
      <div className="border-b border-[#EEDEB3]/50 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#25201A]">
              Sections D & E: Package & Pricing
            </h2>
            <p className="text-xs text-[#665C51]">
              Select AI video invitation preference and enter the agreed package amount
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Step 4 of 5
        </span>
      </div>

      {/* SECTION D: AI VIDEO REQUIREMENT */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-[#25201A] mb-1">
            Do you require an AI-generated wedding invitation video? <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-[#665C51]">
            A cinema-grade AI motion invitation video with the couple&apos;s photos and wedding details. Included in your total package with no extra charge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* YES Option */}
          <button
            type="button"
            onClick={() => updateField("aiVideoRequired", true)}
            className={`relative p-4 rounded-2xl border text-left transition-all flex items-start space-x-3.5 ${
              formData.aiVideoRequired
                ? "bg-[#FCF9F0] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md"
                : "bg-white/80 border-[#EEDEB3] hover:border-[#D4AF37]/50 hover:bg-white"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                formData.aiVideoRequired
                  ? "bg-[#D4AF37] text-white"
                  : "border-2 border-[#D8CDBF] text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-lg font-bold text-[#25201A]">Yes</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0D7] text-[#93611D]">
                  Included
                </span>
              </div>
              <p className="text-xs text-[#665C51] mt-1">
                Yes, generate a personalised AI wedding invitation video.
              </p>
            </div>
          </button>

          {/* NO Option */}
          <button
            type="button"
            onClick={() => updateField("aiVideoRequired", false)}
            className={`relative p-4 rounded-2xl border text-left transition-all flex items-start space-x-3.5 ${
              !formData.aiVideoRequired
                ? "bg-[#FCF9F0] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-md"
                : "bg-white/80 border-[#EEDEB3] hover:border-[#D4AF37]/50 hover:bg-white"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                !formData.aiVideoRequired
                  ? "bg-[#D4AF37] text-white"
                  : "border-2 border-[#D8CDBF] text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-lg font-bold text-[#25201A]">No</span>
                <span className="text-[10px] uppercase font-semibold text-[#8B6E32]">
                  Website Only
                </span>
              </div>
              <p className="text-xs text-[#665C51] mt-1">
                No, we only require the digital wedding website.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION E: AMOUNT CHARGED */}
      <div className="space-y-3 pt-2">
        <div>
          <label className="block text-sm font-semibold text-[#25201A] mb-1">
            Total Amount Charged (₹) <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-[#665C51]">
            Enter the total amount agreed with the customer, including the digital wedding invitation and any optional AI video.
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
        <div className="mt-4 p-4 rounded-2xl bg-[#FCF9F0] border border-[#EEDEB3]/80 space-y-2">
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
              <span>{formData.aiVideoRequired ? "AI Invitation Video (Included)" : "Mobile-First Luxury Layout"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
