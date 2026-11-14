import React from "react";
import { useFormContext } from "../context/FormContext";
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Music,
  Video,
  IndianRupee,
  Edit2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Store,
} from "lucide-react";
import { formatINR, formatDatePretty } from "../utils/formatters";

export default function StepReview() {
  const {
    formData,
    partnerInfo,
    goToStep,
    submitForm,
    isSubmitting,
    submissionError,
  } = useFormContext();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="border-b border-[#EEDEB3]/50 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#25201A]">
              Step 5: Review & Submit Registration
            </h2>
            <p className="text-xs text-[#665C51]">
              Please double check all wedding details before final submission
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Final Step
        </span>
      </div>

      {/* Attribution Banner */}
      <div className="p-3.5 rounded-2xl bg-[#FCF9F0] border border-[#EEDEB3] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#93611D]">
            {partnerInfo.source === "partner" ? <Store size={15} /> : <ShieldCheck size={15} />}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#93611D] block">
              Registration Channel
            </span>
            <span className="text-xs font-semibold text-[#25201A]">
              {partnerInfo.source === "partner"
                ? `Partner: ${partnerInfo.partnerShopName}`
                : "Direct Registration with WebRyza"}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white border border-[#EEDEB3] text-[#7A5E21]">
          {partnerInfo.source === "partner" ? "Partner Verified" : "Direct Customer"}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Card 1: Couple Details */}
        <div className="bg-white/90 rounded-2xl p-4 border border-[#EEDEB3]/70 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EEDEB3]/40 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Heart size={16} className="text-[#93611D]" />
              <h3 className="font-serif text-base font-bold text-[#25201A]">
                Couple & Family Details
              </h3>
            </div>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="inline-flex items-center space-x-1 text-xs text-[#8B6E32] hover:text-[#93611D] font-medium"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#8B6E32] block">Bride:</span>
              <span className="font-semibold text-sm text-[#25201A]">{formData.brideName || "—"}</span>
              <span className="text-[11px] text-[#665C51] block mt-0.5">D/o {formData.brideParents || "—"}</span>
            </div>
            <div>
              <span className="text-[#8B6E32] block">Groom:</span>
              <span className="font-semibold text-sm text-[#25201A]">{formData.groomName || "—"}</span>
              <span className="text-[11px] text-[#665C51] block mt-0.5">S/o {formData.groomParents || "—"}</span>
            </div>
            <div>
              <span className="text-[#8B6E32] block">Contact Phone:</span>
              <span className="font-semibold text-[#25201A] flex items-center space-x-1 mt-0.5">
                <Phone size={12} className="text-[#93611D]" />
                <span>{formData.phone || "—"}</span>
              </span>
            </div>
            <div>
              <span className="text-[#8B6E32] block">Email:</span>
              <span className="font-medium text-[#25201A] flex items-center space-x-1 mt-0.5">
                <Mail size={12} className="text-[#93611D]" />
                <span>{formData.email || "Not provided"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Main Wedding Ceremony */}
        <div className="bg-white/90 rounded-2xl p-4 border border-[#EEDEB3]/70 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EEDEB3]/40 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-[#93611D]" />
              <h3 className="font-serif text-base font-bold text-[#25201A]">
                Wedding Date & Main Venue
              </h3>
            </div>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="inline-flex items-center space-x-1 text-xs text-[#8B6E32] hover:text-[#93611D] font-medium"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#8B6E32] block">Date:</span>
              <span className="font-semibold text-[#25201A] flex items-center space-x-1 mt-0.5">
                <Calendar size={13} className="text-[#93611D]" />
                <span>{formatDatePretty(formData.weddingDate) || "—"}</span>
              </span>
            </div>
            <div>
              <span className="text-[#8B6E32] block">Time / Muhurtham:</span>
              <span className="font-semibold text-[#25201A] flex items-center space-x-1 mt-0.5">
                <Clock size={13} className="text-[#93611D]" />
                <span>{formData.weddingTime || "—"}</span>
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#8B6E32] block">Venue & Address:</span>
              <span className="font-semibold text-[#25201A] block mt-0.5">{formData.venueName || "—"}</span>
              <span className="text-[11px] text-[#665C51] block mt-0.5">{formData.venueAddress || "—"}</span>
              {formData.venueLocation && (
                <a
                  href={formData.venueLocation}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-[11px] text-[#93611D] font-semibold underline mt-1 hover:text-[#7A5E21]"
                >
                  <MapPin size={11} />
                  <span>View Google Maps Link</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Events */}
        <div className="bg-white/90 rounded-2xl p-4 border border-[#EEDEB3]/70 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EEDEB3]/40 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Music size={16} className="text-[#93611D]" />
              <h3 className="font-serif text-base font-bold text-[#25201A]">
                Celebration Events ({formData.events.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="inline-flex items-center space-x-1 text-xs text-[#8B6E32] hover:text-[#93611D] font-medium"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          </div>

          {formData.events.length === 0 ? (
            <p className="text-xs text-[#8B6E32] italic">No additional celebration events added.</p>
          ) : (
            <div className="space-y-2">
              {formData.events.map((ev, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#FCF9F0] border border-[#EEDEB3]/40 text-xs flex items-start justify-between">
                  <div>
                    <span className="font-bold text-[#25201A]">{ev.eventName}</span>
                    <span className="text-[#665C51] block text-[11px] mt-0.5">
                      {formatDatePretty(ev.date)} {ev.time ? `• ${ev.time}` : ""}
                    </span>
                    <span className="text-[#665C51] block text-[11px]">
                      {ev.venueName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 4: Package & Total Amount */}
        <div className="bg-white/90 rounded-2xl p-4 border border-[#EEDEB3]/70 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EEDEB3]/40 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <IndianRupee size={16} className="text-[#93611D]" />
              <h3 className="font-serif text-base font-bold text-[#25201A]">
                Package & Total Amount
              </h3>
            </div>
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="inline-flex items-center space-x-1 text-xs text-[#8B6E32] hover:text-[#93611D] font-medium"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#8B6E32] block">AI Invitation Video:</span>
              <span className="font-semibold text-sm text-[#25201A] block mt-0.5">
                {formData.aiVideoRequired ? "Yes (Included in package)" : "No (Website only)"}
              </span>
            </div>
            <div>
              <span className="text-[#8B6E32] block">Total Amount Agreed:</span>
              <span className="font-bold text-lg text-[#93611D] block mt-0.5">
                {formatINR(formData.amountCharged)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Error Banner */}
      {submissionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-2.5">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-rose-900 mb-0.5">Submission Notice</span>
            <p className="leading-relaxed">{submissionError}</p>
            <p className="text-[11px] text-rose-700 mt-1 font-medium">Your entered form details are preserved. You can retry immediately.</p>
          </div>
        </div>
      )}

      {/* Final Submit Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={submitForm}
          disabled={isSubmitting}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base text-white tracking-wide shadow-lg transition-all flex items-center justify-center space-x-2 ${
            isSubmitting
              ? "bg-[#D8CDBF] cursor-not-allowed"
              : "bg-gradient-to-r from-[#D4AF37] via-[#C9972C] to-[#B8860B] hover:brightness-105 active:scale-[0.99] gold-glow-lg"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin text-white" />
              <span>Submitting Wedding Details...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={20} />
              <span>Submit Wedding Details</span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-[#8B6E32] mt-2">
          By submitting, you agree to receive digital wedding preview links and updates via WhatsApp / SMS.
        </p>
      </div>
    </div>
  );
}
