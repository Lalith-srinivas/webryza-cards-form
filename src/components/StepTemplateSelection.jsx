import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "../context/FormContext";
import {
  Sparkles,
  Landmark,
  Flower2,
  Mail,
  Check,
  Eye,
  X,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import RoyalGold from "../templates/RoyalGold";
import TempleHeritage from "../templates/TempleHeritage";
import ElegantPastel from "../templates/ElegantPastel";
import LakeComoLetters from "../templates/LakeComoLetters";
import { sampleWeddingData } from "../templates/sampleWeddingData";
import { sampleTempleData } from "../templates/sampleTempleData";
import { samplePastelData } from "../templates/samplePastelData";
import { sampleLakeComoData } from "../templates/sampleLakeComoData";

export const TEMPLATES = [
  {
    id: "royal-gold",
    name: "Royal Gold",
    subtitle: "Majestic Palace Celebration",
    badge: "Most Popular",
    color: "#D4AF37",
    textColor: "#38020E",
    bgColor: "#FAF0D7",
    icon: Sparkles,
    description:
      "Classic royal Indian wedding celebration with gold foil accents, palace architecture, and animated shehnai & sitar.",
    previewImg: "/templates/royal-gold/images/royal_gold_texture.jpg",
    component: RoyalGold,
    sampleData: sampleWeddingData,
    previewRoute: "/templates/royal-gold",
  },
  {
    id: "temple-heritage",
    name: "Temple Heritage",
    subtitle: "Sacred South Indian Traditions",
    badge: "Traditional",
    color: "#1b4d3e",
    textColor: "#1b4d3e",
    bgColor: "#e8f2ee",
    icon: Landmark,
    description:
      "Sacred Vedic temple wedding invitation with traditional temple tower motifs, brass lamps, and devotional flute.",
    previewImg: "/templates/temple-heritage/images/temple_hero_bg.jpg",
    component: TempleHeritage,
    sampleData: sampleTempleData,
    previewRoute: "/templates/temple-heritage",
  },
  {
    id: "elegant-pastel-romance",
    aliasId: "elegant-pastel",
    name: "Elegant Pastel Romance",
    subtitle: "Modern Floral Watercolor",
    badge: "Romantic",
    color: "#B47674",
    textColor: "#7D4948",
    bgColor: "#F7ECE8",
    icon: Flower2,
    description:
      "Delicate blush pink watercolor floristry, floating blossom petals, and modern romantic luxury.",
    previewImg: "/templates/elegant-pastel/images/pastel_watercolor_card_bg.jpg",
    component: ElegantPastel,
    sampleData: samplePastelData,
    previewRoute: "/templates/elegant-pastel",
  },
  {
    id: "lakecomo-letters",
    aliasId: "lake-como-letters",
    name: "Lake Como Letters",
    subtitle: "European Editorial Destination",
    badge: "Destination Luxury",
    color: "#3f5138",
    textColor: "#283223",
    bgColor: "#f4efe6",
    icon: Mail,
    description:
      "Handcrafted Italian cotton paper stationery, olive cypress aesthetics, and bespoke destination lakeside letters.",
    previewImg:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    component: LakeComoLetters,
    sampleData: sampleLakeComoData,
    previewRoute: "/templates/lake-como-letters",
  },
];

export default function StepTemplateSelection() {
  const { formData, updateField } = useFormContext();
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Normalize selected template
  const currentSelected = formData.templateId || "royal-gold";

  const handleSelectTemplate = (templateId) => {
    updateField("templateId", templateId);
  };

  // Lock background scroll when full screen preview is active
  useEffect(() => {
    if (previewTemplate) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setPreviewTemplate(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [previewTemplate]);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="border-b border-[#EEDEB3]/50 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF0D7] text-[#93611D] flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#25201A]">
              Step 1: Choose Your Wedding Template
            </h2>
            <p className="text-xs text-[#665C51]">
              Select from our 4 luxury handcrafted design themes. Click &ldquo;Full Preview&rdquo; to experience any template in full screen.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#8B6E32] bg-[#FCF9F0] px-2.5 py-1 rounded-full border border-[#EEDEB3]">
          Step 1 of 6
        </span>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TEMPLATES.map((tmpl) => {
          const isSelected =
            currentSelected === tmpl.id || (tmpl.aliasId && currentSelected === tmpl.aliasId);
          const Icon = tmpl.icon;

          return (
            <div
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl.id)}
              className={`relative rounded-2xl border-2 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between cursor-pointer bg-white group hover:shadow-lg ${
                isSelected
                  ? "border-[#D4AF37] ring-4 ring-[#D4AF37]/20 shadow-md bg-gradient-to-b from-white to-[#FCF9F0]"
                  : "border-[#EEDEB3]/60 hover:border-[#D4AF37]/50 shadow-xs"
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37] text-[#25201A] font-bold text-xs shadow-md">
                  <Check size={13} strokeWidth={3} />
                  <span>Selected</span>
                </div>
              )}

              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0"
                      style={{ backgroundColor: tmpl.bgColor, color: tmpl.color }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#25201A]">
                        {tmpl.name}
                      </h3>
                      <p className="text-[11px] text-[#8B6E32] font-medium">
                        {tmpl.subtitle}
                      </p>
                    </div>
                  </div>
                  {!isSelected && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0D7] text-[#93611D] border border-[#EEDEB3]">
                      {tmpl.badge}
                    </span>
                  )}
                </div>

                {/* Template Visual Thumbnail Container */}
                <div className="relative rounded-xl overflow-hidden aspect-[16/9] mb-3 bg-[#FAF7F2] border border-[#EEDEB3]/50">
                  <img
                    src={tmpl.previewImg}
                    alt={tmpl.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold drop-shadow">
                      {tmpl.subtitle}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#665C51] line-clamp-2 leading-relaxed mb-4">
                  {tmpl.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#EEDEB3]/40 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewTemplate(tmpl);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#EEDEB3] bg-white text-xs font-semibold text-[#25201A] hover:bg-[#FAF0D7] transition-all shadow-2xs"
                >
                  <Eye size={13} className="text-[#93611D]" />
                  <span>Full Preview</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTemplate(tmpl.id);
                  }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    isSelected
                      ? "bg-[#D4AF37] text-[#25201A]"
                      : "bg-[#25201A] text-white hover:bg-[#38020E]"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check size={13} strokeWidth={3} />
                      <span>Template Active</span>
                    </>
                  ) : (
                    <span>Select Template</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* True Full-Screen Modal Preview via React Portal directly on document.body */}
      {previewTemplate &&
        createPortal(
          <div className="fixed inset-0 z-[999999] w-screen h-screen bg-black/95 flex flex-col animate-fadeIn overflow-hidden">
            {/* Full-Screen Top Control Bar - Responsive & Perfectly Aligned on Mobile */}
            <header className="bg-[#1a1108]/95 backdrop-blur-md text-white px-3 sm:px-6 py-2 border-b border-[#D4AF37]/50 shadow-2xl z-50 shrink-0">
              {/* Primary Top Bar Row */}
              <div className="flex items-center justify-between gap-2 h-10">
                {/* Left: Badge & Template Title */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FDF7B8] bg-white/10 px-2 py-0.5 rounded-full border border-white/15 shrink-0">
                    Live Preview
                  </span>
                  <span className="font-serif text-sm font-semibold text-[#EEDEB3] truncate hidden xs:inline sm:text-base">
                    {previewTemplate.name}
                  </span>
                </div>

                {/* Right: Actions (Select + Fullscreen + Close) */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={toggleBrowserFullscreen}
                    className="hidden md:inline-flex items-center p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all text-xs"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectTemplate(previewTemplate.id);
                      setPreviewTemplate(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#25201A] font-bold text-xs sm:text-sm shadow-md hover:brightness-105 active:scale-95 transition-all whitespace-nowrap"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>Select Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(null)}
                    className="p-1.5 sm:p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all shrink-0"
                    title="Close Preview (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Template Switcher Tabs Row - Clean horizontal scroll with no overlap */}
              <div className="mt-1 pt-1.5 border-t border-white/10 flex items-center overflow-x-auto no-scrollbar gap-1.5 py-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] shrink-0 mr-1 hidden sm:inline">
                  Switch Theme:
                </span>
                {TEMPLATES.map((t) => {
                  const isActive = previewTemplate.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreviewTemplate(t)}
                      className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                        isActive
                          ? "bg-[#D4AF37] text-[#25201A] font-bold shadow-sm ring-1 ring-[#D4AF37]"
                          : "text-white/75 hover:text-white bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </header>

            {/* Scrollable Full-Screen Template Content */}
            <main className="flex-1 overflow-y-auto w-full h-full bg-[#FAF7F2] relative">
              {React.createElement(previewTemplate.component, {
                data: previewTemplate.sampleData,
              })}
            </main>
          </div>,
          document.body
        )}
    </div>
  );
}
