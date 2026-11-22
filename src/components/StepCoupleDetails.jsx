import React from "react";
import { useFormContext } from "../context/FormContext";
import { User, Users, Phone, Mail, Heart, Camera, Sparkles, Image as ImageIcon } from "lucide-react";
import ImageUploadField from "./ImageUploadField";
import GalleryUploadField from "./GalleryUploadField";

export default function StepCoupleDetails() {
  const { formData, updateField, errors } = useFormContext();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="border-b border-[#EEDEB3]/50 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
            <Heart size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#25201A]">
              Section A: Couple Details
            </h2>
            <p className="text-xs text-[#665C51]">Enter the bride, groom, and family details</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Step 1 of 5
        </span>
      </div>

      {/* Bride & Groom Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bride Name */}
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Bride&apos;s Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <User size={16} />
            </div>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={formData.brideName}
              onChange={(e) => updateField("brideName", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.brideName ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.brideName && (
            <p className="text-xs text-rose-600 mt-1">{errors.brideName}</p>
          )}
        </div>

        {/* Groom Name */}
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Groom&apos;s Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <User size={16} />
            </div>
            <input
              type="text"
              placeholder="e.g. Rahul Varma"
              value={formData.groomName}
              onChange={(e) => updateField("groomName", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.groomName ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.groomName && (
            <p className="text-xs text-rose-600 mt-1">{errors.groomName}</p>
          )}
        </div>
      </div>

      {/* Parents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bride's Parents */}
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Bride&apos;s Parents&apos; Names <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <Users size={16} />
            </div>
            <input
              type="text"
              placeholder="e.g. Srinivas & Lakshmi Sharma"
              value={formData.brideParents}
              onChange={(e) => updateField("brideParents", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.brideParents ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.brideParents && (
            <p className="text-xs text-rose-600 mt-1">{errors.brideParents}</p>
          )}
        </div>

        {/* Groom's Parents */}
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Groom&apos;s Parents&apos; Names <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <Users size={16} />
            </div>
            <input
              type="text"
              placeholder="e.g. Ramesh & Sita Varma"
              value={formData.groomParents}
              onChange={(e) => updateField("groomParents", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.groomParents ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.groomParents && (
            <p className="text-xs text-rose-600 mt-1">{errors.groomParents}</p>
          )}
        </div>
      </div>

      {/* Contact Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Contact Phone Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <Phone size={16} />
            </div>
            <input
              type="tel"
              placeholder="10-digit mobile (e.g. 9876543210)"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.phone ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.phone ? (
            <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
          ) : (
            <p className="text-[11px] text-[#8B6E32] mt-1">We will send website previews & updates to this WhatsApp/phone number.</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Email Address <span className="text-xs font-normal text-[#8B6E32] lowercase">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <Mail size={16} />
            </div>
            <input
              type="email"
              placeholder="e.g. couple@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.email ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Cloudinary Wedding Photographs Section - Dynamically Configured by Template */}
      {(() => {
        const rawTmpl = (formData.templateId || "royal-gold").toLowerCase().trim();
        const isTemple = rawTmpl.includes("temple") || rawTmpl.includes("vishu") || rawTmpl.includes("heritage");
        const isPastel = rawTmpl.includes("pastel") || rawTmpl.includes("romance");
        const isLakecomo = rawTmpl.includes("lake") || rawTmpl.includes("letters") || rawTmpl.includes("como");
        const isRoyal = !isTemple && !isPastel && !isLakecomo;

        const galleryImages = Array.isArray(formData.galleryImages)
          ? formData.galleryImages
          : (Array.isArray(formData.images?.gallery) ? formData.images.gallery : []);

        return (
          <div className="pt-4 border-t border-[#EEDEB3]/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
                  <Camera size={15} />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#25201A]">
                    {isRoyal && "Royal Gold Wedding Gallery"}
                    {isTemple && "Temple Heritage Couple Photograph"}
                    {isPastel && "Elegant Pastel Romance Photographs & Gallery"}
                    {isLakecomo && "Lake Como Editorial Gallery"}
                  </h3>
                  <p className="text-xs text-[#665C51]">
                    {isRoyal && "Upload between 1 and 6 photographs for your royal wedding gallery grid"}
                    {isTemple && "Upload the couple portrait featured on your traditional temple card"}
                    {isPastel && "Upload couple cover, bride & groom portraits, plus 1 to 8 gallery photos"}
                    {isLakecomo && "Upload between 1 and 7 photographs for your romantic editorial gallery"}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-0.5 rounded-full border border-[#EEDEB3]">
                Cloudinary Powered
              </span>
            </div>

            {/* TEMPLATE 1: Royal Gold -> Gallery Only (1 to 6 images) */}
            {isRoyal && (
              <GalleryUploadField
                label="Wedding Gallery Photos"
                sublabel="1 to 6 photos (Min 1 required)"
                images={galleryImages}
                onChange={(urls) => updateField("galleryImages", urls)}
                minImages={1}
                maxImages={6}
                error={errors.galleryImages}
              />
            )}

            {/* TEMPLATE 2: Temple Heritage -> Exactly One Couple Photo (Required) */}
            {isTemple && (
              <div>
                <ImageUploadField
                  label="Couple Photograph"
                  sublabel="Required portrait (1 photo)"
                  value={formData.couplePhotoUrl}
                  onChange={(url) => updateField("couplePhotoUrl", url)}
                  error={errors.couplePhotoUrl}
                  photoType="couple"
                  aspectRatio="portrait"
                />
              </div>
            )}

            {/* TEMPLATE 3: Elegant Pastel Romance -> Couple (hero), Bride, Groom, & Gallery (1 to 8) */}
            {isPastel && (
              <div className="space-y-4">
                {/* Couple Hero Photo */}
                <div>
                  <ImageUploadField
                    label="Couple Hero Cover Photograph"
                    sublabel="Featured at top of invitation (Required)"
                    value={formData.couplePhotoUrl}
                    onChange={(url) => updateField("couplePhotoUrl", url)}
                    error={errors.couplePhotoUrl}
                    photoType="couple"
                    aspectRatio="landscape"
                  />
                </div>

                {/* Bride & Groom Photos Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadField
                    label="Bride's Photograph"
                    sublabel="Featured in bride section (Required)"
                    value={formData.bridePhotoUrl}
                    onChange={(url) => updateField("bridePhotoUrl", url)}
                    error={errors.bridePhotoUrl}
                    photoType="bride"
                    aspectRatio="portrait"
                  />

                  <ImageUploadField
                    label="Groom's Photograph"
                    sublabel="Featured in groom section (Required)"
                    value={formData.groomPhotoUrl}
                    onChange={(url) => updateField("groomPhotoUrl", url)}
                    error={errors.groomPhotoUrl}
                    photoType="groom"
                    aspectRatio="portrait"
                  />
                </div>

                {/* Gallery */}
                <GalleryUploadField
                  label="Romance Wedding Gallery"
                  sublabel="1 to 8 photos (Min 1 required)"
                  images={galleryImages}
                  onChange={(urls) => updateField("galleryImages", urls)}
                  minImages={1}
                  maxImages={8}
                  error={errors.galleryImages}
                />
              </div>
            )}

            {/* TEMPLATE 4: Lake Como Letters -> Gallery Only (1 to 7 images) */}
            {isLakecomo && (
              <GalleryUploadField
                label="Editorial Gallery Photos"
                sublabel="1 to 7 photos (Min 1 required)"
                images={galleryImages}
                onChange={(urls) => updateField("galleryImages", urls)}
                minImages={1}
                maxImages={7}
                error={errors.galleryImages}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}
