import React from "react";
import { Clock, Film, Sparkles, MessageCircle, Phone, Heart } from "lucide-react";

/**
 * Themed Video Preparation Card
 * Displays when a customer requested an AI wedding video but admin has not yet uploaded it (or video is pending/processing).
 * Matches the aesthetic of each of the 4 templates:
 * - "royal-gold"
 * - "temple-heritage"
 * - "elegant-pastel" / "elegant-pastel-romance"
 * - "lakecomo-letters" / "floral-botanical-romance"
 */
export default function VideoPreparationCard({ theme = "royal-gold", brideName = "", groomName = "" }) {
  const normalizedTheme = String(theme || "").toLowerCase();

  // 1. Royal Gold Theme
  if (normalizedTheme.includes("gold") || normalizedTheme.includes("royal")) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-3">
        <div className="relative rounded-3xl p-6 sm:p-10 text-center overflow-hidden border-2 border-[#D4AF37]/50 shadow-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EC] to-[#F5EED9]">
          {/* Ornate Gold Top Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D4AF37] via-[#F6E29F] to-[#B8860B]" />
          
          {/* Animated Video Reel Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-[#FAF0D7] to-[#FFFDF9] border-2 border-[#D4AF37] flex items-center justify-center text-[#93611D] shadow-lg mb-5 group">
            <Film size={34} className="text-[#C5A059] animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#38020E] text-[#D4AF37] flex items-center justify-center shadow-xs">
              <Sparkles size={13} />
            </div>
          </div>

          {/* Subtitle Badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#8B6514] bg-[#FAF0D7] border border-[#EEDEB3] mb-3 shadow-2xs">
            <Clock size={12} className="animate-spin text-[#93611D]" style={{ animationDuration: "8s" }} />
            Cinematic Studio • In Production
          </span>

          {/* Title */}
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#38020E] tracking-tight">
            Your Wedding Video Is Being Prepared!
          </h3>

          {/* Message Paragraphs */}
          <div className="mt-4 space-y-3 text-xs sm:text-sm text-[#5C5247] leading-relaxed max-w-md mx-auto">
            <p className="font-medium text-[#25201A]">
              We&apos;re preparing something special for your wedding invitation.
            </p>
            
            <div className="py-2.5 px-4 rounded-2xl bg-[#FFFDF9] border border-[#D4AF37]/40 shadow-xs text-[#8B6514] font-semibold flex items-center justify-center gap-2">
              <Clock size={15} className="text-[#93611D]" />
              <span>Your video will be available within 24 hours.</span>
            </div>

            <p className="text-[11px] sm:text-xs text-[#706456]">
              If your video is not available after 24 hours, please contact our team for assistance.
            </p>
          </div>

          {/* Contact Assistance & Signature */}
          <div className="mt-6 pt-5 border-t border-[#EEDEB3]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#8B6514]">
              <a
                href="https://wa.me/919989831499?text=Hello%20WebRyza,%20I%20need%20assistance%20with%20my%20wedding%20invitation%20video."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF0D7] hover:bg-[#F3E5AB] text-[#38020E] font-semibold text-xs border border-[#D4AF37]/40 transition-colors"
              >
                <MessageCircle size={13} className="text-emerald-700" />
                <span>Contact Support</span>
              </a>
            </div>
            <span className="font-serif italic font-bold text-[#38020E] text-xs">
              Thank you for choosing WebRyza!
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Temple Heritage Theme
  if (normalizedTheme.includes("temple") || normalizedTheme.includes("vishu") || normalizedTheme.includes("heritage")) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-3">
        <div className="relative rounded-3xl p-6 sm:p-10 text-center overflow-hidden border-2 border-[#8B6514]/40 shadow-2xl bg-gradient-to-b from-[#FCF9F0] via-[#FAF4E5] to-[#F3E9D0]">
          {/* Temple Gold & Deep Green Top Border */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1b4d3e] via-[#D4AF37] to-[#8B6514]" />

          {/* Icon Motif */}
          <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-[#FAF4E5] to-[#FFFFFF] border-2 border-[#8B6514] flex items-center justify-center text-[#1b4d3e] shadow-lg mb-5">
            <Film size={34} className="text-[#8B6514] animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#1b4d3e] text-[#D4AF37] flex items-center justify-center shadow-xs">
              <Sparkles size={13} />
            </div>
          </div>

          {/* Subtitle Badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#1b4d3e] bg-[#FAF4E5] border border-[#8B6514]/30 mb-3 shadow-2xs">
            <Clock size={12} className="animate-spin text-[#1b4d3e]" style={{ animationDuration: "8s" }} />
            Sacred Heritage Film • In Preparation
          </span>

          {/* Title */}
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1b4d3e] tracking-tight">
            Your Wedding Video Is Being Prepared!
          </h3>

          {/* Message Paragraphs */}
          <div className="mt-4 space-y-3 text-xs sm:text-sm text-[#4A3E31] leading-relaxed max-w-md mx-auto">
            <p className="font-medium text-[#1b4d3e]">
              We&apos;re preparing something special for your wedding invitation.
            </p>

            <div className="py-2.5 px-4 rounded-2xl bg-[#FCF9F0] border border-[#8B6514]/30 shadow-xs text-[#1b4d3e] font-semibold flex items-center justify-center gap-2">
              <Clock size={15} className="text-[#8B6514]" />
              <span>Your video will be available within 24 hours.</span>
            </div>

            <p className="text-[11px] sm:text-xs text-[#6A5A48]">
              If your video is not available after 24 hours, please contact our team for assistance.
            </p>
          </div>

          {/* Contact Assistance & Signature */}
          <div className="mt-6 pt-5 border-t border-[#8B6514]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <a
              href="https://wa.me/919989831499?text=Hello%20WebRyza,%20I%20need%20assistance%20with%20my%20wedding%20invitation%20video."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF4E5] hover:bg-[#F3E9D0] text-[#1b4d3e] font-semibold text-xs border border-[#8B6514]/30 transition-colors"
            >
              <MessageCircle size={13} className="text-[#1b4d3e]" />
              <span>Contact Support</span>
            </a>
            <span className="font-serif italic font-bold text-[#1b4d3e] text-xs">
              Thank you for choosing WebRyza!
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Elegant Pastel Romance Theme
  if (normalizedTheme.includes("pastel") || normalizedTheme.includes("watercolor") || normalizedTheme.includes("romance")) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-3">
        <div className="relative rounded-3xl p-6 sm:p-10 text-center overflow-hidden border border-[#E8D4D3] shadow-xl bg-gradient-to-b from-[#FFFDFD] via-[#FDF8F7] to-[#F7ECE8]">
          {/* Dusty Rose Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D9A5A4] via-[#7D4948] to-[#B47674]" />

          {/* Icon Motif */}
          <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-[#F7ECE8] to-[#FFFFFF] border border-[#E8D4D3] flex items-center justify-center text-[#7D4948] shadow-md mb-5">
            <Film size={32} className="text-[#B47674] animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#7D4948] text-[#F7ECE8] flex items-center justify-center shadow-xs">
              <Heart size={12} fill="currentColor" />
            </div>
          </div>

          {/* Subtitle Badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#7D4948] bg-[#F7ECE8] border border-[#E8D4D3] mb-3">
            <Clock size={12} className="animate-spin text-[#7D4948]" style={{ animationDuration: "8s" }} />
            Couple Story Film • In Production
          </span>

          {/* Title */}
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#7D4948] tracking-tight">
            Your Wedding Video Is Being Prepared!
          </h3>

          {/* Message Paragraphs */}
          <div className="mt-4 space-y-3 text-xs sm:text-sm text-[#5C524F] leading-relaxed max-w-md mx-auto">
            <p className="font-medium text-[#7D4948]">
              We&apos;re preparing something special for your wedding invitation.
            </p>

            <div className="py-2.5 px-4 rounded-2xl bg-[#FFFDFD] border border-[#E8D4D3] shadow-xs text-[#7D4948] font-semibold flex items-center justify-center gap-2">
              <Clock size={15} className="text-[#B47674]" />
              <span>Your video will be available within 24 hours.</span>
            </div>

            <p className="text-[11px] sm:text-xs text-[#7A6B69]">
              If your video is not available after 24 hours, please contact our team for assistance.
            </p>
          </div>

          {/* Contact Assistance & Signature */}
          <div className="mt-6 pt-5 border-t border-[#E8D4D3]/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <a
              href="https://wa.me/919989831499?text=Hello%20WebRyza,%20I%20need%20assistance%20with%20my%20wedding%20invitation%20video."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7ECE8] hover:bg-[#EED8D6] text-[#7D4948] font-semibold text-xs border border-[#E8D4D3] transition-colors"
            >
              <MessageCircle size={13} className="text-[#7D4948]" />
              <span>Contact Support</span>
            </a>
            <span className="font-serif italic font-bold text-[#7D4948] text-xs">
              Thank you for choosing WebRyza!
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Floral Botanical Romance (Lake Como Letters) Theme
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-3">
      <div className="relative rounded-3xl p-6 sm:p-10 text-center overflow-hidden border border-[#dcd5c7] shadow-xl bg-[#f9f7f2]">
        {/* Subtle Deckle Top Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3f5138] via-[#c5a46d] to-[#3f5138]" />

        {/* Botanical Flank Accents */}
        <img
          src="/floral/corner-peach-blush.png"
          alt=""
          className="absolute -top-6 -left-6 w-20 h-20 opacity-80 pointer-events-none"
        />
        <img
          src="/floral/corner-peach-blush-right.png"
          alt=""
          className="absolute -top-6 -right-6 w-20 h-20 opacity-80 pointer-events-none"
        />

        {/* Icon Motif */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-[#FAF7F2] border border-[#c5a46d]/60 flex items-center justify-center text-[#3f5138] shadow-md mb-5">
          <Film size={32} className="text-[#3f5138] animate-pulse" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#3f5138] text-[#c5a46d] flex items-center justify-center shadow-xs">
            <Sparkles size={12} />
          </div>
        </div>

        {/* Subtitle Badge */}
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#3f5138] bg-[#EAE5DB] border border-[#dcd5c7] mb-3">
          <Clock size={12} className="animate-spin text-[#3f5138]" style={{ animationDuration: "8s" }} />
          Handcrafted Botanical Film • In Production
        </span>

        {/* Title */}
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#222B1E] tracking-tight">
          Your Wedding Video Is Being Prepared!
        </h3>

        {/* Message Paragraphs */}
        <div className="mt-4 space-y-3 text-xs sm:text-sm text-[#4E5648] leading-relaxed max-w-md mx-auto">
          <p className="font-medium text-[#222B1E]">
            We&apos;re preparing something special for your wedding invitation.
          </p>

          <div className="py-2.5 px-4 rounded-2xl bg-[#FFFFFF] border border-[#c5a46d]/40 shadow-xs text-[#3f5138] font-semibold flex items-center justify-center gap-2">
            <Clock size={15} className="text-[#c5a46d]" />
            <span>Your video will be available within 24 hours.</span>
          </div>

          <p className="text-[11px] sm:text-xs text-[#6B7365]">
            If your video is not available after 24 hours, please contact our team for assistance.
          </p>
        </div>

        {/* Contact Assistance & Signature */}
        <div className="mt-6 pt-5 border-t border-[#dcd5c7]/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <a
            href="https://wa.me/919989831499?text=Hello%20WebRyza,%20I%20need%20assistance%20with%20my%20wedding%20invitation%20video."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAE5DB] hover:bg-[#DFD8CC] text-[#222B1E] font-semibold text-xs border border-[#dcd5c7] transition-colors"
          >
            <MessageCircle size={13} className="text-[#3f5138]" />
            <span>Contact Support</span>
          </a>
          <span className="font-serif italic font-bold text-[#222B1E] text-xs">
            Thank you for choosing WebRyza!
          </span>
        </div>
      </div>
    </div>
  );
}
