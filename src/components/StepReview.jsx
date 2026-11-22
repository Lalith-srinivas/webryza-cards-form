import React from "react";
import { useFormContext } from "../context/FormContext";
import {
  Sparkles,
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
  ExternalLink,
} from "lucide-react";
import { formatINR, formatDatePretty } from "../utils/formatters";
import { TEMPLATES } from "./StepTemplateSelection";

export default function StepReview() {
  const {
    formData,
    partnerInfo,
    goToStep,
    submitForm,
    isSubmitting,
    submissionError,
  } = useFormContext();

  // Find selected template meta
  const selectedTemplate =
    TEMPLATES.find(
      (t) =>
        t.id === formData.templateId ||
        t.aliasId === formData.templateId
    ) || TEMPLATES[0];

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
              Step 6: Review & Generate Website
            </h2>
            <p className="text-xs text-[#665C51]">
              Please double check all wedding details before publishing your website
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Final Review
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
        {/* Card 0: Selected Template */}
        <div className="bg-white/95 rounded-2xl p-4 border-2 border-[#D4AF37]/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EEDEB3]/50 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-[#93611D]" />
              <h3 className="font-serif text-base font-bold text-[#25201A]">
                Selected Wedding Template
              </h3>
            </div>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="inline-flex items-center space-x-1 text-xs text-[#8B6E32] hover:text-[#93611D] font-medium"
            >
              <Edit2 size={13} />
              <span>Change Template</span>
            </button>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#EEDEB3] shadow-xs">
              <img
                src={selectedTemplate.previewImg}
                alt={selectedTemplate.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-base text-[#25201A]">
                  {selectedTemplate.name}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0D7] text-[#93611D] border border-[#EEDEB3]">
                  {selectedTemplate.badge}
                </span>
              </div>
              <p className="text-xs text-[#665C51] mt-0.5">
                {selectedTemplate.subtitle} • {selectedTemplate.description}
              </p>
            </div>
          </div>
        </div>

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
              onClick={() => goToStep(2)}
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
            <div className="flex items-center space-x-1.5 pt-1 text-[#4A4036]">
              <Phone size={13} className="text-[#93611D]" />
              <span>{formData.phone || "—"}</span>
            </div>
            {formData.email && (
              <div className="flex items-center space-x-1.5 pt-1 text-[#4A4036]">
                <Mail size={13} className="text-[#93611D]" />
                <span>{formData.email}</span>
              </div>
            )}
          </div>

          {/* Uploaded Cloudinary Photos & Gallery Preview in Review Step */}
          {(() => {
            const galleryList = Array.isArray(formData.galleryImages)
              ? formData.galleryImages
              : (Array.isArray(formData.images?.gallery) ? formData.images.gallery : []);
            const hasPhotos = formData.bridePhotoUrl || formData.groomPhotoUrl || formData.couplePhotoUrl || galleryList.length > 0;

            if (!hasPhotos) return null;

            return (
              <div className="mt-3 pt-3 border-t border-[#EEDEB3]/50 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#8B6E32]">
                  <span>Attached Wedding Photos:</span>
                  {galleryList.length > 0 && (
                    <span className="text-[#93611D]">{galleryList.length} Gallery Photos</span>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {formData.couplePhotoUrl && (
                    <div className="w-14 h-11 rounded-lg overflow-hidden border border-[#D4AF37]/50 shadow-xs shrink-0" title="Couple Photo">
                      <img src={formData.couplePhotoUrl} alt="Couple" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {formData.bridePhotoUrl && (
                    <div className="w-9 h-11 rounded-lg overflow-hidden border border-[#D4AF37]/50 shadow-xs shrink-0" title="Bride Photo">
                      <img src={formData.bridePhotoUrl} alt="Bride" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {formData.groomPhotoUrl && (
                    <div className="w-9 h-11 rounded-lg overflow-hidden border border-[#D4AF37]/50 shadow-xs shrink-0" title="Groom Photo">
                      <img src={formData.groomPhotoUrl} alt="Groom" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {galleryList.map((url, idx) => (
                    <div key={idx} className="w-11 h-11 rounded-lg overflow-hidden border border-[#EEDEB3] shadow-xs shrink-0" title={`Gallery Photo ${idx + 1}`}>
                      <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Card 2: Main Wedding Details */}
        <div className="bg-white/90 rounded-2xl p-4 border border-[#EEDEB3]/70 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EEDEB3]/40 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-[#93611D]" />
              <h3 className="font-serif text-base font-bold text-[#25201A]">
                Main Wedding Ceremony
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Calendar size={14} className="text-[#93611D] shrink-0" />
              <div>
                <span className="text-[#8B6E32] block text-[11px]">Wedding Date</span>
                <span className="font-semibold text-[#25201A]">
                  {formData.weddingDate ? formatDatePretty(formData.weddingDate) : "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-[#93611D] shrink-0" />
              <div>
                <span className="text-[#8B6E32] block text-[11px]">Muhurtham / Time</span>
                <span className="font-semibold text-[#25201A]">{formData.weddingTime || "—"}</span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-start space-x-2 pt-1 border-t border-[#EEDEB3]/30">
              <MapPin size={14} className="text-[#93611D] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#25201A] block">{formData.venueName || "—"}</span>
                <span className="text-[#665C51] text-[11px] block">{formData.venueAddress || "—"}</span>
                {formData.venueLocation && (
                  <a
                    href={formData.venueLocation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[11px] text-[#93611D] hover:underline mt-0.5 font-medium"
                  >
                    <span>View Google Map</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Events Schedule */}
        <div className="bg-white/90 rounded-2xl p-4 border border-[#EEDEB3]/70 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EEDEB3]/40 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Music size={16} className="text-[#93611D]" />
              <h3 className="font-serif text-base font-bold text-[#25201A]">
                Wedding Functions & Events ({formData.events.length})
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

          {formData.events.length === 0 ? (
            <p className="text-xs text-[#8B6E32] italic">
              No additional sub-events added. Only the main wedding ceremony will be featured.
            </p>
          ) : (
            <div className="divide-y divide-[#EEDEB3]/40">
              {formData.events.map((ev, i) => (
                <div key={ev.id || i} className="py-2.5 first:pt-0 last:pb-0 text-xs flex justify-between items-start">
                  <div>
                    <span className="font-bold text-[#25201A] text-sm block">{ev.eventName}</span>
                    <span className="text-[#665C51] block text-[11px] mt-0.5">
                      {ev.date ? formatDatePretty(ev.date) : ""} {ev.time ? `• ${ev.time}` : ""}
                    </span>
                    {ev.venueName && (
                      <span className="text-[#8B6E32] block text-[11px] mt-0.5">
                        📍 {ev.venueName} {ev.venueAddress ? `(${ev.venueAddress})` : ""}
                      </span>
                    )}
                  </div>
                  {ev.locationLink && (
                    <a
                      href={ev.locationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#93611D] hover:underline font-medium shrink-0 ml-2"
                    >
                      Map ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 4: Package Pricing & AI Video */}
        <div className="bg-white/90 rounded-2xl p-4 border border-[#EEDEB3]/70 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#EEDEB3]/40 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <IndianRupee size={16} className="text-[#93611D]" />
              <h3 className="font-serif text-base font-bold text-[#25201A]">
                Package & Add-Ons
              </h3>
            </div>
            <button
              type="button"
              onClick={() => goToStep(5)}
              className="inline-flex items-center space-x-1 text-xs text-[#8B6E32] hover:text-[#93611D] font-medium"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EEDEB3]/50">
              <div className="flex items-center space-x-1.5 text-[#8B6E32]">
                <Video size={14} className="text-[#93611D]" />
                <span className="font-medium text-[11px]">AI Invitation Video</span>
              </div>
              <span className="font-bold text-sm text-[#25201A] block mt-1">
                {formData.aiVideoRequired ? "Yes, Required" : "Not Required"}
              </span>
              <span className="text-[10px] text-[#665C51] block mt-0.5">
                {formData.aiVideoRequired
                  ? "Bespoke cinematic couple intro video will be produced"
                  : "Standard premium website invitation"}
              </span>
            </div>

            <div className="p-3 bg-[#FCF9F0] rounded-xl border border-[#D4AF37]/40">
              <div className="flex items-center space-x-1.5 text-[#8B6E32]">
                <IndianRupee size={14} className="text-[#93611D]" />
                <span className="font-medium text-[11px]">Agreed Total Amount</span>
              </div>
              <span className="font-bold text-lg text-[#93611D] block mt-0.5">
                {formatINR(formData.amountCharged)}
              </span>
              <span className="text-[10px] text-[#8B6E32] block">
                Inclusive of complete digital setup & hosting
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Error Banner */}
      {submissionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2 animate-shake">
          <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-bold">Generation failed</p>
            <p className="mt-0.5">{submissionError}</p>
          </div>
        </div>
      )}

      {/* Primary Submit Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={submitForm}
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#C59B27] to-[#B8860B] text-white text-base font-bold shadow-lg shadow-[#D4AF37]/30 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>CREATING YOUR WEDDING WEBSITE...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="tracking-wide">GENERATE MY WEDDING WEBSITE</span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-[#8B6E32] mt-2.5">
          By generating, your digital wedding invitation will be published with instant live preview & QR code.
        </p>
      </div>
    </div>
  );
}
