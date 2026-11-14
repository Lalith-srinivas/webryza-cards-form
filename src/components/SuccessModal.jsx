import React, { useEffect, useState } from "react";
import { useFormContext } from "../context/FormContext";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Heart,
  Phone,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Share2,
} from "lucide-react";
import { formatINR } from "../utils/formatters";

export default function SuccessModal() {
  const { submissionResult, resetForm } = useFormContext();
  const [copied, setCopied] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      const end = Date.now() + 1.2 * 1000;
      const colors = ["#D4AF37", "#E6CA65", "#FFFDF9", "#B8860B"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {
      // Confetti fallback
    }
  }, []);

  const data = submissionResult?.data || {};
  const registrationId = submissionResult?.id || data.id || "WR-" + Date.now().toString(36).toUpperCase();

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(registrationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // WhatsApp click handler
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || "919876543210";
  const whatsappMessage = encodeURIComponent(
    `Hello WebRyza Team,\n\nI have successfully submitted my wedding registration details!\n\nReference ID: ${registrationId}\nBride: ${data.brideName}\nGroom: ${data.groomName}\nPhone: ${data.phone}\nPackage Amount: ₹${data.amountCharged}\nAI Video: ${data.aiVideoRequired ? "Yes" : "No"}\n\nPlease let me know the next steps for our wedding website!`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="bg-white/95 rounded-3xl border border-[#EEDEB3] p-6 sm:p-10 shadow-xl text-center relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B]" />

        {/* Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#FAF0D7] to-[#FFFDF9] border-2 border-[#D4AF37] mx-auto flex items-center justify-center text-[#93611D] mb-4 shadow-md">
          <CheckCircle2 size={36} className="text-[#C9972C]" />
        </div>

        {/* Headings */}
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#25201A]">
          Your Wedding Details Have Been Submitted!
        </h1>

        <p className="mt-3 text-sm sm:text-base text-[#665C51] max-w-lg mx-auto leading-relaxed">
          Thank you for choosing <span className="font-semibold text-[#93611D]">WebRyza</span>. We have successfully received your wedding details. Our team will review your information and create your personalised digital wedding invitation.
        </p>

        {/* Reference ID Pill */}
        <div className="mt-6 inline-flex flex-col sm:flex-row items-center justify-center gap-2 p-3 bg-[#FCF9F0] border border-[#EEDEB3] rounded-2xl max-w-md mx-auto w-full">
          <span className="text-xs uppercase font-bold text-[#8B6E32] tracking-wider">
            Registration Ref ID:
          </span>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm sm:text-base font-bold text-[#25201A] tracking-wider select-all">
              {registrationId}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1.5 rounded-lg bg-white border border-[#EEDEB3] text-[#93611D] hover:bg-[#FAF0D7] transition-colors"
              title="Copy ID"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Registration Summary Card */}
        <div className="mt-6 text-left bg-[#FAF7F2] rounded-2xl p-5 border border-[#EEDEB3]/70 space-y-3">
          <div className="text-xs font-bold text-[#93611D] uppercase tracking-wider border-b border-[#EEDEB3]/50 pb-2">
            Submitted Summary
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#8B6E32] block">Bride & Groom:</span>
              <span className="font-semibold text-sm text-[#25201A]">
                {data.brideName} & {data.groomName}
              </span>
            </div>

            <div>
              <span className="text-[#8B6E32] block">Contact Number:</span>
              <span className="font-semibold text-sm text-[#25201A]">
                {data.phone}
              </span>
            </div>

            <div>
              <span className="text-[#8B6E32] block">Agreed Amount:</span>
              <span className="font-bold text-sm text-[#93611D]">
                {formatINR(data.amountCharged)}
              </span>
            </div>

            <div>
              <span className="text-[#8B6E32] block">AI Invitation Video:</span>
              <span className="font-semibold text-sm text-[#25201A]">
                {data.aiVideoRequired ? "Yes (Requested)" : "No (Website Only)"}
              </span>
            </div>

            {data.partnerShopName && (
              <div className="sm:col-span-2">
                <span className="text-[#8B6E32] block">Registration Source:</span>
                <span className="font-medium text-xs text-[#25201A]">
                  {data.source === "partner" ? `Partner: ${data.partnerShopName}` : "Direct WebRyza Registration"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps Info Box */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-left text-xs text-amber-900 leading-relaxed">
          <span className="font-bold block text-amber-950 mb-1">What happens next?</span>
          Our design team will curate your photos, events, and venue maps into your bespoke digital wedding website. Once crafted, we host it and share the final personalized link directly to your WhatsApp.
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-sm rounded-xl shadow-md transition-all hover:brightness-105"
          >
            <MessageCircle size={18} />
            <span>Connect on WhatsApp</span>
          </a>

          {/* New Registration Button */}
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white border border-[#EEDEB3] text-[#25201A] hover:bg-[#FAF0D7] font-semibold text-sm rounded-xl transition-colors"
          >
            <RefreshCw size={16} className="text-[#93611D]" />
            <span>Submit Another Registration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
