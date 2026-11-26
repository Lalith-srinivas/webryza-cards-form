import React, { useState, useEffect } from "react";
import RoyalGold from "../templates/RoyalGold";
import TempleHeritage from "../templates/TempleHeritage";
import ElegantPastel from "../templates/ElegantPastel";
import LakeComoLetters from "../templates/LakeComoLetters";
import { sampleWeddingData } from "../templates/sampleWeddingData";
import { sampleTempleData } from "../templates/sampleTempleData";
import { samplePastelData } from "../templates/samplePastelData";
import { sampleLakeComoData } from "../templates/sampleLakeComoData";
import { ArrowLeft, Sparkles, Landmark, Flower2, Mail, Maximize2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function TemplatePreviewPage({ initialTemplate }) {
  const location = useLocation();

  const getInitialTemplate = () => {
    if (initialTemplate) return initialTemplate;
    const path = location.pathname.toLowerCase();
    if (path.includes("lake-como") || path.includes("lakecomo") || path.includes("letters")) {
      return "lake-como-letters";
    }
    if (path.includes("pastel") || path.includes("romance")) {
      return "elegant-pastel";
    }
    if (path.includes("temple") || path.includes("vishu") || path.includes("heritage")) {
      return "temple-heritage";
    }
    return "royal-gold";
  };

  const [activeTemplate, setActiveTemplate] = useState(getInitialTemplate);
  const [showBanner, setShowBanner] = useState(true);

  // Automatically scroll back to the very top whenever switching templates
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [activeTemplate]);

  const handleSwitchTemplate = (templateName) => {
    setActiveTemplate(templateName);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

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
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Floating Preview Banner - Responsive on Mobile */}
      {showBanner && (
        <header className="sticky top-0 z-50 bg-[#1a1108]/95 backdrop-blur-md text-[#FFFDF7] px-3 sm:px-6 py-2 sm:py-2.5 border-b border-[#D4AF37]/50 shadow-md text-xs">
          {/* Top row */}
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FDF7B8] font-medium transition-all shrink-0"
            >
              <ArrowLeft size={13} />
              <span>Back to Form</span>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={toggleBrowserFullscreen}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Toggle Fullscreen"
              >
                <Maximize2 size={14} />
              </button>

              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="px-2.5 py-1 rounded text-white/70 hover:text-white"
              >
                Hide
              </button>
            </div>
          </div>

          {/* Template Switcher Tabs Row */}
          <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center overflow-x-auto no-scrollbar gap-1.5 py-0.5">
            <button
              type="button"
              onClick={() => handleSwitchTemplate("royal-gold")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTemplate === "royal-gold"
                  ? "bg-[#D4AF37] text-[#38020E] shadow"
                  : "text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
              }`}
            >
              <Sparkles size={12} />
              <span>Royal Gold</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTemplate("temple-heritage")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTemplate === "temple-heritage"
                  ? "bg-[#D4AF37] text-[#1b4d3e] shadow"
                  : "text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
              }`}
            >
              <Landmark size={12} />
              <span>Temple Heritage</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTemplate("elegant-pastel")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTemplate === "elegant-pastel"
                  ? "bg-[#F7ECE8] text-[#7D4948] shadow font-bold"
                  : "text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
              }`}
            >
              <Flower2 size={12} className={activeTemplate === "elegant-pastel" ? "text-[#B47674]" : ""} />
              <span>Elegant Pastel Romance</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTemplate("lake-como-letters")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTemplate === "lake-como-letters"
                  ? "bg-[#3f5138] text-[#f9f7f2] shadow font-bold"
                  : "text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
              }`}
            >
              <Mail size={12} className={activeTemplate === "lake-como-letters" ? "text-[#c5a46d]" : ""} />
              <span>Floral Botanical Romance</span>
            </button>
          </div>
        </header>
      )}

      {/* Render Selected Full-Screen Template */}
      <div key={activeTemplate} className="w-full min-h-screen">
        {activeTemplate === "lake-como-letters" || activeTemplate === "lakecomo-letters" ? (
          <LakeComoLetters data={sampleLakeComoData} />
        ) : activeTemplate === "elegant-pastel" || activeTemplate === "elegant-pastel-romance" ? (
          <ElegantPastel data={samplePastelData} />
        ) : activeTemplate === "temple-heritage" ? (
          <TempleHeritage data={sampleTempleData} />
        ) : (
          <RoyalGold data={sampleWeddingData} />
        )}
      </div>
    </div>
  );
}
