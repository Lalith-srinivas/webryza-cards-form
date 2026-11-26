import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "../context/FormContext";
import { QRCodeCanvas } from "qrcode.react";
import {
  CreditCard,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Upload,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Info,
  RefreshCw,
  Clock,
  ArrowRight
} from "lucide-react";
import { formatINR } from "../utils/formatters";
import { fetchPaymentConfig } from "../services/paymentConfigService";
import { generateUpiUri, validateUpiTransactionRef } from "../utils/upiGenerator";
import { uploadPaymentProof, validatePaymentProofFile } from "../services/paymentProofService";

export default function StepPayment() {
  const { formData, updateField, errors } = useFormContext();

  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Screenshot upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Generate deterministic temporary order ref for payment tracking
  const [orderRef] = useState(() => {
    const timestamp = Date.now().toString().slice(-4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `WR-${timestamp}${rand}`;
  });

  // 1. Fetch active payment configuration from Firestore (app_settings/payment_config)
  const loadConfig = async () => {
    setIsLoadingConfig(true);
    setConfigError(null);
    try {
      const res = await fetchPaymentConfig();
      if (res.success && res.config?.upiId) {
        setPaymentConfig(res.config);
        // Record snapshot into form state
        updateField("payment", {
          ...(formData.payment || {}),
          upiIdUsed: res.config.upiId,
          upiDisplayNameUsed: res.config.upiDisplayName || "WebRyza",
        });
      } else {
        setConfigError(res.error || "Unable to retrieve active UPI payment settings.");
      }
    } catch (err) {
      console.error("Failed to load payment config:", err);
      setConfigError("Payment configuration is currently unavailable. Please try again.");
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const upiId = paymentConfig?.upiId || formData.payment?.upiIdUsed || "";
  const upiDisplayName = paymentConfig?.upiDisplayName || formData.payment?.upiDisplayNameUsed || "WebRyza";
  const amountToPay = formData.amountCharged || "1500";

  // 2. Generate UPI URI
  let upiUri = "";
  try {
    if (upiId) {
      upiUri = generateUpiUri({
        upiId,
        displayName: upiDisplayName,
        amount: amountToPay,
        orderRef,
        note: `Wedding Card ${orderRef}`,
      });
    }
  } catch (err) {
    console.warn("Error creating UPI URI:", err);
  }

  const handleCopyUpi = () => {
    if (upiId && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handlePayViaIntent = () => {
    if (!upiUri) return;
    window.location.href = upiUri;
  };

  // 3. Handle Payment Proof Screenshot Upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const validation = validatePaymentProofFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const result = await uploadPaymentProof(file, orderRef, (p) => setUploadProgress(p));
      updateField("payment", {
        ...(formData.payment || {}),
        upiIdUsed: upiId,
        upiDisplayNameUsed: upiDisplayName,
        paymentProof: result,
      });
    } catch (err) {
      console.error("Payment proof upload failed:", err);
      setUploadError(err.message || "Failed to upload screenshot. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveProof = () => {
    updateField("payment", {
      ...(formData.payment || {}),
      paymentProof: null,
    });
    setUploadError(null);
  };

  const handleUtrChange = (val) => {
    updateField("payment", {
      ...(formData.payment || {}),
      upiIdUsed: upiId,
      upiDisplayNameUsed: upiDisplayName,
      transactionReference: val,
    });
  };

  const paymentProof = formData.payment?.paymentProof;
  const transactionRef = formData.payment?.transactionReference || "";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Section Header */}
      <div className="border-b border-[#EEDEB3]/50 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
            <CreditCard size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#25201A]">
              Step 6: UPI Payment & Verification
            </h2>
            <p className="text-xs text-[#665C51]">
              Scan the QR code or pay with any UPI app, then submit your transaction receipt
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Step 6 of 7
        </span>
      </div>

      {/* Loading Configuration State */}
      {isLoadingConfig && (
        <div className="p-8 rounded-3xl bg-white border border-[#EEDEB3] flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 size={28} className="animate-spin text-[#D4AF37]" />
          <p className="text-sm font-semibold text-[#25201A]">
            Fetching active payment configuration...
          </p>
          <p className="text-xs text-[#8B6E32]">
            Connecting to secure WebRyza payment settings
          </p>
        </div>
      )}

      {/* Configuration Error Alert */}
      {configError && !isLoadingConfig && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 space-y-3">
          <div className="flex items-start space-x-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Payment Settings Unavailable</h4>
              <p className="text-xs mt-0.5 text-rose-700">{configError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadConfig}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all shadow-xs"
          >
            <RefreshCw size={12} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Active Payment Content */}
      {!isLoadingConfig && !configError && (
        <div className="space-y-6">
          {/* 1. PAYMENT SUMMARY & UPI QR CODE CARD */}
          <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#1B1510] via-[#2A1E14] to-[#16110D] text-white shadow-xl border border-[#D4AF37]/30 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: Amount, UPI ID, Action Button */}
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#EEDEB3]/80 block">
                    Amount to Pay
                  </span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-[#F3E5AB]">
                      {formatINR(amountToPay)}
                    </span>
                    <span className="text-xs text-[#EEDEB3]/70 font-medium">
                      (Inclusive of all features)
                    </span>
                  </div>
                </div>

                {/* WebRyza Official UPI ID */}
                <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#EEDEB3]/80">
                    <span>Payee UPI ID:</span>
                    <span className="text-[10px] bg-[#D4AF37]/30 text-[#FCE38A] px-2 py-0.2 rounded-full border border-[#D4AF37]/40">
                      Official
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wide select-all">
                      {upiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all border border-white/20 cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-300">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Direct Pay by UPI App Button */}
                <div>
                  <button
                    type="button"
                    onClick={handlePayViaIntent}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#C59B27] to-[#B8860B] text-white font-bold text-sm shadow-lg shadow-[#D4AF37]/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Smartphone size={17} />
                    <span>Pay by Any UPI App</span>
                  </button>
                  <p className="text-[11px] text-[#EEDEB3]/70 text-center mt-1.5">
                    Opens Google Pay, PhonePe, Paytm, BHIM, or CRED on your mobile.
                  </p>
                </div>
              </div>

              {/* Right Column: Dynamic QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  {upiUri ? (
                    <QRCodeCanvas
                      value={upiUri}
                      size={180}
                      level="H"
                      marginSize={1}
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-gray-400">
                      <QrCode size={48} />
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <span className="text-xs font-semibold text-[#F3E5AB] flex items-center justify-center space-x-1">
                    <QrCode size={13} />
                    <span>Scan with Any UPI App</span>
                  </span>
                  <p className="text-[10px] text-[#EEDEB3]/70 mt-0.5 max-w-[210px]">
                    Point your camera or UPI scanner at the QR code above to complete payment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. PAYMENT PROOF SCREENSHOT UPLOAD */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#EEDEB3] shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-[#25201A]">
                  Upload Payment Screenshot <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#8B6E32]">JPG, JPEG, PNG (Max 5 MB)</span>
              </div>
              <p className="text-xs text-[#665C51] mt-0.5">
                Take a screenshot of the successful transaction screen from your UPI app and upload it here.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
            />

            {/* Uploaded Screenshot State */}
            {paymentProof?.url ? (
              <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5 w-full sm:w-auto">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 border border-emerald-300 shadow-xs shrink-0 flex items-center justify-center">
                    <img
                      src={paymentProof.url}
                      alt="Payment Receipt"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-900 truncate">
                        Receipt Uploaded
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 block truncate mt-0.5 max-w-xs">
                      {paymentProof.originalFileName || "payment_screenshot.jpg"}
                    </span>
                    <span className="text-[10px] text-emerald-600/80 block font-mono">
                      {paymentProof.fileFormat?.toUpperCase()} • Cloudinary Secure Asset
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-xl border border-emerald-600/30 bg-white text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveProof}
                    disabled={isUploading}
                    className="p-1.5 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shadow-xs"
                    title="Remove"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone for Uploading */
              <div
                onClick={() => {
                  if (!isUploading) fileInputRef.current?.click();
                }}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                  errors.paymentProof || uploadError
                    ? "border-rose-400 bg-rose-50/30"
                    : "border-[#EEDEB3] bg-[#FCF9F0]/60 hover:bg-[#FAF0D7]/40 hover:border-[#D4AF37]"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform mb-3">
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>

                <span className="text-xs font-bold text-[#25201A]">
                  {isUploading ? "Uploading Screenshot..." : "Click to Upload Payment Screenshot"}
                </span>
                <span className="text-[11px] text-[#665C51] mt-1">
                  Supports JPG, JPEG, PNG up to 5 MB
                </span>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="w-full max-w-xs mt-3">
                    <div className="w-full bg-[#EEDEB3]/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#D4AF37] h-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#8B6E32] font-semibold mt-1 block">
                      {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error Message for Screenshot */}
            {(uploadError || errors.paymentProof) && (
              <p className="text-xs text-rose-600 font-semibold flex items-center space-x-1.5 mt-1 animate-shake">
                <AlertCircle size={13} className="shrink-0" />
                <span>{uploadError || errors.paymentProof}</span>
              </p>
            )}
          </div>

          {/* 3. MANDATORY UPI TRANSACTION REFERENCE NUMBER (UTR) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#EEDEB3] shadow-sm space-y-3">
            <div>
              <label className="block text-sm font-semibold text-[#25201A] mb-1">
                UPI Transaction Reference (UTR / Ref No.) <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-[#665C51]">
                Enter the 12-digit transaction reference number (UTR) found in your payment app confirmation.
              </p>
            </div>

            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="e.g. 412345678901"
                value={transactionRef}
                onChange={(e) => handleUtrChange(e.target.value)}
                maxLength={35}
                className={`w-full px-4 py-3 bg-white border rounded-xl text-base font-mono font-bold text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all shadow-sm ${
                  errors.transactionReference
                    ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400"
                    : "border-[#EEDEB3]"
                }`}
              />
            </div>

            {errors.transactionReference && (
              <p className="text-xs text-rose-600 font-semibold flex items-center space-x-1.5 mt-1 animate-shake">
                <AlertCircle size={13} className="shrink-0" />
                <span>{errors.transactionReference}</span>
              </p>
            )}
          </div>

          {/* 4. VERIFICATION PENDING TRANSPARENCY NOTICE */}
          <div className="p-4 rounded-2xl bg-[#FCF9F0] border border-[#EEDEB3] flex items-start space-x-3">
            <Clock size={18} className="text-[#93611D] shrink-0 mt-0.5" />
            <div className="text-xs text-[#665C51] space-y-1">
              <p className="font-bold text-[#25201A]">
                Instant Website Generation &amp; Background Verification
              </p>
              <p>
                Your website will be published immediately after you confirm your details in the next step.
                Your payment status will display as <span className="font-bold text-[#93611D]">Verification Pending</span> until reviewed by our verification team.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
