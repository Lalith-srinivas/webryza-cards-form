import React, { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Check, Download, QrCode, ExternalLink, Sparkles } from "lucide-react";

export default function PartnerQrCard({ partnerCode, shopName }) {
  const qrRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const registrationUrl = `https://cards.webryza.in/?ref=${partnerCode}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `WebRyza-QR-${partnerCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-[#12100E] border border-[#39FF14]/30 rounded-3xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
      {/* Decorative Neon Top Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#39FF14]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* QR Code Container */}
        <div className="flex flex-col items-center shrink-0">
          <div
            ref={qrRef}
            className="p-3 bg-white rounded-2xl shadow-lg border-2 border-[#39FF14]/40 flex items-center justify-center relative"
          >
            <QRCodeCanvas
              value={registrationUrl}
              size={130}
              level="H"
              marginSize={1}
            />
          </div>
          <button
            type="button"
            onClick={handleDownloadQr}
            className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1A1714] border border-[#26211C] hover:border-[#39FF14]/50 text-xs font-semibold text-[#FAF7F2] hover:text-[#39FF14] transition-all"
            title="Download QR code to print in your wedding cards shop"
          >
            <Download size={13} />
            <span>Download QR (PNG)</span>
          </button>
        </div>

        {/* Link Info & Actions */}
        <div className="flex-1 text-center md:text-left space-y-2.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] text-[11px] font-bold">
              <QrCode size={12} />
              <span>Partner QR Referral</span>
            </span>
            <span className="text-xs text-[#A89F91]">
              For physical card print shop display
            </span>
          </div>

          <h3 className="font-serif text-lg font-bold text-[#FAF7F2]">
            {shopName} Registration Portal
          </h3>

          <p className="text-xs text-[#A89F91] leading-relaxed max-w-xl">
            Couples who scan this QR code or click your link will be automatically attributed to your partner account. You earn your commission on every submitted wedding card!
          </p>

          {/* URL Pill & Copy Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <div className="flex-1 w-full bg-[#0A0908] border border-[#26211C] rounded-xl px-3 py-2 text-xs font-mono text-[#39FF14] truncate select-all">
              {registrationUrl}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  copied
                    ? "bg-[#39FF14] text-[#0A0908]"
                    : "bg-[#1A1714] text-[#FAF7F2] border border-[#39FF14]/40 hover:border-[#39FF14] hover:text-[#39FF14]"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Link Copied!" : "Copy Link"}</span>
              </button>

              <a
                href={registrationUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#1A1714] border border-[#26211C] text-[#A89F91] hover:text-[#39FF14] hover:border-[#39FF14]/50 transition-colors"
                title="Open registration page in new tab"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
