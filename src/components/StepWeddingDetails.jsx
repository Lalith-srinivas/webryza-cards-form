import React from "react";
import { useFormContext } from "../context/FormContext";
import { Calendar, Clock, MapPin, Navigation, FileText } from "lucide-react";

export default function StepWeddingDetails() {
  const { formData, updateField, errors } = useFormContext();

  const timePresets = ["09:00 AM", "10:30 AM", "11:45 AM", "06:30 PM", "07:30 PM"];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="border-b border-[#EEDEB3]/50 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
            <Calendar size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#25201A]">
              Section B: Main Wedding Details
            </h2>
            <p className="text-xs text-[#665C51]">Set the primary date, time, and main wedding venue</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Step 2 of 5
        </span>
      </div>

      {/* Date & Time Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Wedding Date */}
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Wedding Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <Calendar size={16} />
            </div>
            <input
              type="date"
              value={formData.weddingDate}
              onChange={(e) => updateField("weddingDate", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.weddingDate ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.weddingDate && (
            <p className="text-xs text-rose-600 mt-1">{errors.weddingDate}</p>
          )}
        </div>

        {/* Wedding Time */}
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Wedding Time / Muhurtham <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <Clock size={16} />
            </div>
            <input
              type="text"
              placeholder="e.g. 10:30 AM (Sumuhurtham)"
              value={formData.weddingTime}
              onChange={(e) => updateField("weddingTime", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.weddingTime ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] text-[#8B6E32] self-center">Presets:</span>
            {timePresets.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => updateField("weddingTime", time)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-[#FCF9F0] border border-[#EEDEB3] text-[#7A5E21] hover:bg-[#F7F0DC] transition-colors"
              >
                {time}
              </button>
            ))}
          </div>
          {errors.weddingTime && (
            <p className="text-xs text-rose-600 mt-1">{errors.weddingTime}</p>
          )}
        </div>
      </div>

      {/* Venue Name & Address */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Venue Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <MapPin size={16} />
            </div>
            <input
              type="text"
              placeholder="e.g. Grand Convention Hall & Palace"
              value={formData.venueName}
              onChange={(e) => updateField("venueName", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.venueName ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.venueName && (
            <p className="text-xs text-rose-600 mt-1">{errors.venueName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Venue Address <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Main Road, Near Alipiri, Tirupati, Andhra Pradesh - 517501"
            value={formData.venueAddress}
            onChange={(e) => updateField("venueAddress", e.target.value)}
            className={`w-full p-3 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
              errors.venueAddress ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
            }`}
          />
          {errors.venueAddress && (
            <p className="text-xs text-rose-600 mt-1">{errors.venueAddress}</p>
          )}
        </div>
      </div>

      {/* Google Maps Link & Additional Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Google Maps Location Link <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#998F81]">
              <Navigation size={16} />
            </div>
            <input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={formData.venueLocation}
              onChange={(e) => updateField("venueLocation", e.target.value)}
              className={`w-full pl-9 pr-3 py-2.5 bg-white/90 border rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm ${
                errors.venueLocation ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : "border-[#EEDEB3]"
              }`}
            />
          </div>
          {errors.venueLocation ? (
            <p className="text-xs text-rose-600 mt-1">{errors.venueLocation}</p>
          ) : (
            <p className="text-[11px] text-[#8B6E32] mt-1">Guests will tap &ldquo;Get Directions&rdquo; to navigate straight to your venue.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#25201A] uppercase tracking-wider mb-1">
            Additional Details & Notes <span className="text-xs font-normal text-[#8B6E32] lowercase">(optional)</span>
          </label>
          <div className="relative">
            <textarea
              rows={2}
              placeholder="e.g. Traditional attire requested. Dinner follows the ceremony. Wedding hashtag #PriyaWedsRahul"
              value={formData.additionalDetails}
              onChange={(e) => updateField("additionalDetails", e.target.value)}
              className="w-full p-3 bg-white/90 border border-[#EEDEB3] rounded-xl text-sm text-[#25201A] placeholder-[#B5ABA0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
