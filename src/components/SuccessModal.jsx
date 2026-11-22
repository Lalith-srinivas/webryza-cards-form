import React, { useEffect, useState, useRef } from "react";
import { useFormContext } from "../context/FormContext";
import confetti from "canvas-confetti";
import { QRCodeCanvas } from "qrcode.react";
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Download,
  Share2,
  Sparkles,
  RefreshCw,
  QrCode,
  Globe,
  Heart,
} from "lucide-react";
import { TEMPLATES } from "./StepTemplateSelection";

export default function SuccessModal() {
  const { submissionResult, resetForm } = useFormContext();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const qrCanvasRef = useRef(null);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      const end = Date.now() + 1.5 * 1000;
      const colors = ["#D4AF37", "#E6CA65", "#FFFDF9", "#B8860B", "#1b4d3e"];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
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
  const weddingId = submissionResult?.weddingId || data.weddingId || "0001";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://cards.webryza.in";
  const liveUrl = submissionResult?.websiteUrl || data.websiteUrl || `${baseUrl}/card=${weddingId}`;
  const templateId = submissionResult?.templateId || data.templateId || "royal-gold";

  // Find template friendly name
  const templateMeta =
    TEMPLATES.find((t) => t.id === templateId || t.aliasId === templateId) || TEMPLATES[0];

  // Copy website link
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(liveUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  // Copy Wedding ID
  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(weddingId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Download QR Code as high-res PNG image
  const handleDownloadQr = () => {
    try {
      const canvas = document.getElementById("wedding-qr-canvas");
      if (!canvas) return;

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Wedding-Invitation-${weddingId}-QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Failed to download QR Code:", err);
    }
  };

  // WhatsApp share
  const shareMessage = encodeURIComponent(
    `*Wedding Invitation: ${data.brideName} & ${data.groomName}*\n\nWe cordially invite you to celebrate our wedding!\n\nPlease open our digital wedding invitation card & details here:\n${liveUrl}\n\nWe look forward to your presence and blessings!`
  );
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareMessage}`;

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
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#93611D] bg-[#FAF0D7] px-3 py-1 rounded-full border border-[#EEDEB3] inline-block mb-2">
          Step 8 • Website Ready
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#25201A]">
          YOUR WEDDING WEBSITE IS READY!
        </h1>

        <p className="mt-2 text-sm sm:text-base text-[#665C51] max-w-lg mx-auto leading-relaxed">
          Congratulations <span className="font-semibold text-[#25201A]">{data.brideName} & {data.groomName}</span>! Your digital wedding invitation has been generated and is live.
        </p>

        {/* Status & Key Metadata Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left bg-[#FCF9F0] p-3.5 rounded-2xl border border-[#EEDEB3]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B6E32] block">Wedding ID</span>
            <div className="flex items-center space-x-1">
              <span className="font-mono text-xs font-bold text-[#25201A]">#{weddingId}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-[#93611D] hover:text-[#25201A]"
                title="Copy ID"
              >
                {copiedId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B6E32] block">Theme</span>
            <span className="text-xs font-semibold text-[#25201A] truncate block">
              {templateMeta.name}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B6E32] block">Website Status</span>
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Published</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#8B6E32] block">AI Video</span>
            <span className="text-xs font-semibold text-[#25201A]">
              {data.aiVideoRequired ? "Pending Render" : "Not Requested"}
            </span>
          </div>
        </div>

        {/* Live Website Link Card */}
        <div className="mt-6 bg-[#FAF7F2] border-2 border-[#D4AF37]/50 rounded-2xl p-4 text-left shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#93611D] flex items-center space-x-1.5">
              <Globe size={14} />
              <span>Your Public Invitation Link</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active & Shareable
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={liveUrl}
              className="w-full font-mono text-xs sm:text-sm font-semibold text-[#25201A] bg-white border border-[#EEDEB3] rounded-xl px-3 py-2.5 focus:outline-none select-all shadow-inner"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all shrink-0 shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-white" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>COPY LINK</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scannable QR Code Section */}
        <div className="mt-6 p-5 bg-white rounded-2xl border border-[#EEDEB3] flex flex-col sm:flex-row items-center justify-between gap-5 text-left">
          <div className="flex flex-col items-center sm:items-start space-y-2">
            <div className="flex items-center space-x-2 text-[#93611D]">
              <QrCode size={18} />
              <h3 className="font-serif font-bold text-base text-[#25201A]">
                Printable Guest QR Code
              </h3>
            </div>
            <p className="text-xs text-[#665C51] max-w-xs text-center sm:text-left">
              Guests can scan this QR code with any mobile camera to immediately open your wedding invitation and venue maps.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-[#D4AF37] bg-[#FAF0D7] text-[#93611D] text-xs font-bold hover:bg-[#F3E5AB] transition-colors"
              >
                <Download size={14} />
                <span>Download QR (PNG)</span>
              </button>
            </div>
          </div>

          {/* Real Scannable QR Code Canvas */}
          <div className="p-3 bg-white border-2 border-[#D4AF37] rounded-2xl shadow-sm shrink-0 flex flex-col items-center">
            <QRCodeCanvas
              id="wedding-qr-canvas"
              value={liveUrl}
              size={140}
              level="H"
              includeMargin={true}
            />
            <span className="text-[10px] font-bold text-[#8B6E32] mt-1.5 tracking-wider">
              SCAN TO VIEW
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-sm font-bold shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            <span>OPEN WEDDING WEBSITE</span>
            <ExternalLink size={16} />
          </a>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] text-white text-sm font-bold shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            <Share2 size={16} />
            <span>SHARE ON WHATSAPP</span>
          </a>
        </div>

        {/* Reset / Register Another Button */}
        <div className="mt-6 pt-4 border-t border-[#EEDEB3]/50 flex justify-center">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center space-x-1.5 text-xs text-[#8B6E32] hover:text-[#93611D] font-semibold"
          >
            <RefreshCw size={13} />
            <span>Create Another Wedding Invitation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
