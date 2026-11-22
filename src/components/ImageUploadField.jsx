import React, { useState, useRef } from "react";
import { Upload, X, RefreshCw, CheckCircle2, AlertCircle, Camera, Image as ImageIcon } from "lucide-react";
import { uploadWeddingPhoto } from "../services/cloudinaryService";
import { validateImageFile } from "../utils/imageCompressor";

export default function ImageUploadField({
  label,
  sublabel,
  value,
  onChange,
  photoType = "couple",
  aspectRatio = "portrait", // "portrait" | "square" | "landscape"
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers onChange
    e.target.value = "";

    // 1. Client-Side Validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setProgress(10);

    try {
      const uploadResult = await uploadWeddingPhoto(file, photoType, (p) => setProgress(p));
      if (uploadResult?.url) {
        onChange(uploadResult.url);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setErrorMessage(err.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange("");
    setErrorMessage(null);
  };

  const handleTriggerPicker = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const aspectClass =
    aspectRatio === "portrait"
      ? "aspect-[3/4] max-h-56"
      : aspectRatio === "square"
      ? "aspect-square max-h-48"
      : "aspect-[16/9] max-h-48";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider">
          {label}
        </label>
        {sublabel && (
          <span className="text-[11px] text-[#8B6E32]">{sublabel}</span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Image Preview or Upload Dropzone */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#D4AF37]/50 bg-[#FAF0D7]/20 p-2 group shadow-xs">
          <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-black/5 flex items-center justify-center`}>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Top Status Badge */}
            <div className="absolute top-2 left-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-sm border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
              <CheckCircle2 size={11} />
              <span>Ready</span>
            </div>

            {/* Quick Action Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleTriggerPicker}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-xs font-semibold text-[#25201A] shadow-md transition-transform active:scale-95"
                title="Replace with another photo"
              >
                <RefreshCw size={12} />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-xs font-semibold text-white shadow-md transition-transform active:scale-95"
                title="Remove photo"
              >
                <X size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#665C51]">
            <span className="truncate max-w-[200px]">Cloudinary Photo Attached</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleTriggerPicker}
                className="text-[#8B6E32] hover:text-[#93611D] font-medium underline"
              >
                Replace
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-rose-600 hover:text-rose-700 font-medium underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={handleTriggerPicker}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            isUploading
              ? "border-[#D4AF37] bg-[#FAF0D7]/30"
              : "border-[#EEDEB3] hover:border-[#D4AF37] hover:bg-[#FAF0D7]/20 bg-white/60"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <RefreshCw size={24} className="animate-spin text-[#93611D]" />
              <p className="text-xs font-semibold text-[#25201A]">
                Compressing & Uploading to Cloudinary...
              </p>
              <div className="w-36 bg-[#EEDEB3] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#D4AF37] h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-[#665C51]">High-resolution optimization active</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
                <Camera size={18} />
              </div>
              <p className="text-xs font-semibold text-[#25201A]">
                Click or drag to upload {label.toLowerCase()}
              </p>
              <p className="text-[11px] text-[#8B6E32]">
                Supports JPG, PNG, WebP • Auto-compressed up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-600 mt-1">
          <AlertCircle size={13} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
