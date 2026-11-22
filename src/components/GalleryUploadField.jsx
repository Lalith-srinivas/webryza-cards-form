import React, { useState, useRef } from "react";
import { Upload, X, RefreshCw, CheckCircle2, AlertCircle, Plus, Images, Sparkles } from "lucide-react";
import { uploadWeddingPhoto } from "../services/cloudinaryService";
import { validateImageFile } from "../utils/imageCompressor";

export default function GalleryUploadField({
  label = "Wedding Gallery Photos",
  sublabel = "Uploaded photos will be featured in the interactive photo gallery",
  minImages = 1,
  maxImages = 6,
  images = [],
  onChange,
  error = null,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [localError, setLocalError] = useState(null);
  const [replaceIndex, setReplaceIndex] = useState(null);

  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  const currentCount = Array.isArray(images) ? images.length : 0;
  const isMinMet = currentCount >= minImages;
  const isFull = currentCount >= maxImages;

  // Handle batch file selection for adding new images
  const handleBatchSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = ""; // Reset input

    setLocalError(null);

    // Check total limit
    const remainingSlots = maxImages - currentCount;
    if (remainingSlots <= 0) {
      setLocalError(`You have already uploaded the maximum limit of ${maxImages} images.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setLocalError(`Only ${remainingSlots} more image(s) can be added (Maximum: ${maxImages}).`);
    }

    // Validate all files first
    for (const file of filesToUpload) {
      const v = validateImageFile(file);
      if (!v.valid) {
        setLocalError(v.error);
        return;
      }
    }

    setIsUploading(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgressText(`Uploading ${i + 1} of ${filesToUpload.length}...`);
        const result = await uploadWeddingPhoto(file, "gallery");
        if (result?.url) {
          uploadedUrls.push(result.url);
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
      }
    } catch (err) {
      console.error("Gallery batch upload failed:", err);
      setLocalError(err.message || "Failed to upload one or more photos. Please retry.");
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
    }
  };

  // Handle replacing a single image at a specific index
  const handleReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || replaceIndex === null) return;
    e.target.value = "";

    const v = validateImageFile(file);
    if (!v.valid) {
      setLocalError(v.error);
      return;
    }

    setLocalError(null);
    setIsUploading(true);
    setUploadProgressText(`Replacing photo #${replaceIndex + 1}...`);

    try {
      const result = await uploadWeddingPhoto(file, "gallery");
      if (result?.url) {
        const updated = [...images];
        updated[replaceIndex] = result.url;
        onChange(updated);
      }
    } catch (err) {
      console.error("Replace photo failed:", err);
      setLocalError(err.message || "Failed to replace photo.");
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      setReplaceIndex(null);
    }
  };

  // Remove a single image
  const handleRemove = (idxToRemove) => {
    const updated = images.filter((_, idx) => idx !== idxToRemove);
    onChange(updated);
    setLocalError(null);
  };

  const triggerReplace = (index) => {
    if (isUploading) return;
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-white/95 border border-[#EEDEB3] shadow-xs">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBatchSelect}
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFile}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Header with Counter Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#EEDEB3]/50 pb-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <Images size={16} className="text-[#93611D]" />
            <h4 className="font-serif text-sm font-bold text-[#25201A]">
              {label} <span className="text-rose-500">*</span>
            </h4>
          </div>
          {sublabel && (
            <p className="text-[11px] text-[#665C51] mt-0.5">{sublabel}</p>
          )}
        </div>

        {/* Counter Pill */}
        <div className="flex items-center space-x-2 shrink-0">
          <span
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isFull
                ? "bg-[#D4AF37] text-white shadow-xs"
                : isMinMet
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                : "bg-amber-50 text-amber-800 border border-amber-300"
            }`}
          >
            <span>Gallery Photos ({currentCount}/{maxImages})</span>
            {isMinMet && <CheckCircle2 size={13} className="text-emerald-600" />}
          </span>
        </div>
      </div>

      {/* Requirement Notice */}
      <div className="text-[11px] text-[#8B6E32] flex items-center justify-between">
        <span>Minimum: {minImages} photo required • Maximum: {maxImages} photos</span>
        {currentCount > 0 && !isFull && (
          <span className="font-medium">You can add {maxImages - currentCount} more</span>
        )}
      </div>

      {/* Loading Banner during upload */}
      {isUploading && (
        <div className="p-3 rounded-xl bg-[#FAF0D7]/60 border border-[#D4AF37]/40 flex items-center justify-center space-x-2 text-xs font-semibold text-[#93611D] animate-pulse">
          <RefreshCw size={15} className="animate-spin" />
          <span>{uploadProgressText || "Compressing & uploading high-res photos to Cloudinary..."}</span>
        </div>
      )}

      {/* Uploaded Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((url, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-xl overflow-hidden border-2 border-[#EEDEB3] hover:border-[#D4AF37] transition-all bg-[#FAF0D7]/20 shadow-xs"
          >
            <img
              src={url}
              alt={`Gallery photo ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Sequence Badge */}
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono font-semibold backdrop-blur-xs">
              #{idx + 1}
            </div>

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
              <button
                type="button"
                onClick={() => triggerReplace(idx)}
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#25201A] text-[10px] font-semibold shadow-sm transition-transform active:scale-95"
                title="Replace this photo"
              >
                <RefreshCw size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold shadow-sm transition-transform active:scale-95"
                title="Remove this photo"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}

        {/* Add More Dropcard (Visible if not full) */}
        {!isFull && (
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-all ${
              isUploading
                ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                : "border-[#D4AF37]/50 hover:border-[#D4AF37] bg-[#FAF0D7]/20 hover:bg-[#FAF0D7]/40"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center mb-1.5 shadow-xs">
              <Plus size={16} />
            </div>
            <span className="text-xs font-semibold text-[#25201A]">
              {currentCount === 0 ? "Upload Photos" : "Add More"}
            </span>
            <span className="text-[10px] text-[#8B6E32] mt-0.5">
              Select 1 or multiple
            </span>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {(error || localError) && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-600 pt-1">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error || localError}</span>
        </div>
      )}
    </div>
  );
}
