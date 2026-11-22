import React, { useState } from "react";
import RoyalGold from "../templates/RoyalGold";
import TempleHeritage from "../templates/TempleHeritage";
import ElegantPastel from "../templates/ElegantPastel";
import LakeComoLetters from "../templates/LakeComoLetters";
import { sampleWeddingData } from "../templates/sampleWeddingData";
import { sampleTempleData } from "../templates/sampleTempleData";
import { samplePastelData } from "../templates/samplePastelData";
import { sampleLakeComoData } from "../templates/sampleLakeComoData";
import { ArrowLeft, Sparkles, Landmark, Flower2, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function TemplatePreviewPage({ initialTemplate }) {
  const location = useLocation();

  const getInitialTemplate = () => {
    if (initialTemplate) return initialTemplate;
    if (location.pathname.includes("lake-como") || location.pathname.includes("letters")) {
      return "lake-como-letters";
    }
    if (location.pathname.includes("pastel") || location.pathname.includes("romance")) {
      return "elegant-pastel";
    }
    if (location.pathname.includes("temple") || location.pathname.includes("vishu")) {
      return "temple-heritage";
    }
    return "royal-gold";
  };

  const [activeTemplate, setActiveTemplate] = useState(getInitialTemplate);
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="relative min-h-screen">
      {/* Floating Preview Banner */}
      {showBanner && (
        <div className="sticky top-0 z-50 bg-[#1a1108] text-[#FFFDF7] px-4 py-2.5 flex items-center justify-between border-b border-[#D4AF37]/50 shadow-md text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#FDF7B8] font-medium transition-all"
            >
              <ArrowLeft size={13} />
              <span>Back to Form</span>
            </Link>

            {/* Template Switcher Tabs */}
            <div className="flex items-center bg-black/40 p-0.5 rounded-full border border-white/10 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setActiveTemplate("royal-gold")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTemplate === "royal-gold"
                    ? "bg-[#D4AF37] text-[#38020E] shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Sparkles size={12} />
                <span>Royal Gold</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTemplate("temple-heritage")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTemplate === "temple-heritage"
                    ? "bg-[#D4AF37] text-[#1b4d3e] shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Landmark size={12} />
                <span>Temple Heritage</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTemplate("elegant-pastel")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTemplate === "elegant-pastel"
                    ? "bg-[#F7ECE8] text-[#7D4948] shadow font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Flower2 size={12} className={activeTemplate === "elegant-pastel" ? "text-[#B47674]" : ""} />
                <span>Elegant Pastel Romance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTemplate("lake-como-letters")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTemplate === "lake-como-letters"
                    ? "bg-[#3f5138] text-[#f9f7f2] shadow font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Mail size={12} className={activeTemplate === "lake-como-letters" ? "text-[#c5a46d]" : ""} />
                <span>Lake Como Letters</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="px-2.5 py-1 rounded text-white/70 hover:text-white"
            >
              Hide Bar
            </button>
          </div>
        </div>
      )}

      {/* Render Selected Template */}
      {activeTemplate === "lake-como-letters" ? (
        <LakeComoLetters data={sampleLakeComoData} />
      ) : activeTemplate === "elegant-pastel" ? (
        <ElegantPastel data={samplePastelData} />
      ) : activeTemplate === "temple-heritage" ? (
        <TempleHeritage data={sampleTempleData} />
      ) : (
        <RoyalGold data={sampleWeddingData} />
      )}
    </div>
  );
}
