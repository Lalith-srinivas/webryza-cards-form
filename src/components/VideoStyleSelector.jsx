import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Volume2, VolumeX, Check, X, Film, Sparkles, Maximize2 } from "lucide-react";
import { VIDEO_STYLES } from "../constants/videoStyles";

export { VIDEO_STYLES };

export default function VideoStyleSelector({ selectedStyle, onSelectStyle, onClearStyle, error }) {
  const [playingId, setPlayingId] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [modalStyle, setModalStyle] = useState(null);
  const [modalMuted, setModalMuted] = useState(false); // Audio ON when full screen opens
  const [modalPlaying, setModalPlaying] = useState(true);
  const videoRefs = useRef({});
  const modalVideoRef = useRef(null);

  // Open Full-Screen Modal with Audio ON
  const openFullscreenModal = (style) => {
    // Pause any playing inline card video
    if (playingId && videoRefs.current[playingId]) {
      videoRefs.current[playingId].pause();
    }
    setPlayingId(null);

    setModalStyle(style);
    setModalMuted(false); // Audio ON
    setModalPlaying(true);
    document.body.style.overflow = "hidden";
  };

  // Close Full-Screen Modal
  const closeFullscreenModal = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
    setModalStyle(null);
    setModalPlaying(false);
    document.body.style.overflow = "auto";
  };

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && modalStyle) {
        closeFullscreenModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [modalStyle]);

  // Handle modal video playback when opened
  useEffect(() => {
    if (modalStyle && modalVideoRef.current) {
      modalVideoRef.current.muted = modalMuted;
      modalVideoRef.current.play().then(() => {
        setModalPlaying(true);
      }).catch((err) => {
        console.warn("Unmuted autoplay restricted by browser policy, tap to play:", err);
      });
    }
  }, [modalStyle, modalMuted]);

  // Ensure only one inline video plays at a time
  const handlePlayToggle = (styleId) => {
    const currentVideo = videoRefs.current[styleId];
    if (!currentVideo) return;

    if (playingId === styleId) {
      currentVideo.pause();
      setPlayingId(null);
    } else {
      if (playingId && videoRefs.current[playingId]) {
        videoRefs.current[playingId].pause();
      }
      currentVideo.play().then(() => {
        setPlayingId(styleId);
      }).catch((err) => {
        console.warn("Autoplay / play error:", err);
      });
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    Object.values(videoRefs.current).forEach((vid) => {
      if (vid) vid.muted = nextMuted;
    });
  };

  const toggleModalPlay = () => {
    if (!modalVideoRef.current) return;
    if (modalPlaying) {
      modalVideoRef.current.pause();
      setModalPlaying(false);
    } else {
      modalVideoRef.current.play().then(() => {
        setModalPlaying(true);
      });
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Header & Global Mute Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <Film size={18} className="text-[#93611D]" />
            <h4 className="font-serif text-base sm:text-lg font-bold text-[#25201A]">
              Choose Your Video Style <span className="text-rose-500">*</span>
            </h4>
          </div>
          <p className="text-xs text-[#665C51] mt-0.5">
            Click on any video to preview in full screen with audio, and select your preferred style.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleMuteToggle}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#EEDEB3] text-[#4A4036] hover:bg-[#FAF0D7] transition-all shadow-xs cursor-pointer"
            title={isMuted ? "Unmute audio for preview" : "Mute audio"}
          >
            {isMuted ? <VolumeX size={14} className="text-[#998F81]" /> : <Volume2 size={14} className="text-[#93611D]" />}
            <span>{isMuted ? "Audio Muted" : "Audio On"}</span>
          </button>

          {selectedStyle && (
            <button
              type="button"
              onClick={onClearStyle}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all shadow-xs cursor-pointer"
            >
              <X size={13} />
              <span>Clear Selection</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-shake">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of 4 Video Style Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {VIDEO_STYLES.map((style) => {
          const isSelected = selectedStyle === style.name;
          const isPlaying = playingId === style.id;

          return (
            <div
              key={style.id}
              className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "bg-[#FCF9F0] border-[#D4AF37] ring-4 ring-[#D4AF37]/25 shadow-lg shadow-[#D4AF37]/15"
                  : "bg-white border-[#EEDEB3]/80 hover:border-[#D4AF37]/60 hover:shadow-md"
              }`}
            >
              {/* Card Header */}
              <div className="p-3.5 border-b border-[#EEDEB3]/50 flex items-center justify-between bg-white/70">
                <div className="flex items-center space-x-2">
                  <span className="font-serif text-base font-bold text-[#25201A]">
                    {style.name}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${style.badgeColor}`}>
                    {style.badge}
                  </span>
                </div>
                {isSelected && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37] text-white shadow-xs">
                    <Check size={12} strokeWidth={3} />
                    <span>Selected</span>
                  </span>
                )}
              </div>

              {/* Video Player Container: Clicking opens full screen with sound ON */}
              <div
                className="p-3 bg-[#110D09] cursor-pointer"
                onClick={() => openFullscreenModal(style)}
              >
                <div className="relative w-full aspect-[9/14] max-h-[380px] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center group">
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefs.current[style.id] = el;
                        el.muted = isMuted;
                      }
                    }}
                    src={style.videoSrc}
                    poster={style.posterSrc}
                    preload="metadata"
                    playsInline
                    loop
                    className="w-full h-full object-cover"
                  />

                  {/* Play & Fullscreen Overlay on Card */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 text-[#93611D] flex items-center justify-center shadow-lg shadow-black/50 group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-200">
                      <Play size={24} className="fill-current ml-1" />
                    </div>
                  </div>

                  {/* Bottom Video Badge Indicator */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-medium text-white/95 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md">
                      <Maximize2 size={11} />
                      <span>Click for Fullscreen & Sound</span>
                    </span>
                    <span className="text-[10px] font-mono text-white/80 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md">
                      1080p HD
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Description & Action Buttons */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-3 bg-white">
                <div>
                  <h5 className="text-xs font-semibold text-[#8B6E32]">
                    {style.subtitle}
                  </h5>
                  <p className="text-xs text-[#665C51] mt-1 leading-relaxed">
                    {style.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onClearStyle();
                      } else {
                        onSelectStyle(style.name);
                      }
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/30 hover:brightness-105"
                        : "bg-[#FAF7F2] text-[#25201A] border border-[#EEDEB3] hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37]"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check size={14} strokeWidth={3} />
                        <span>Selected Style</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Select {style.name}</span>
                      </>
                    )}
                  </button>

                  {isSelected && (
                    <button
                      type="button"
                      onClick={onClearStyle}
                      className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all shrink-0 cursor-pointer"
                      title="Clear selection"
                      aria-label="Clear selection"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPACT REELS-STYLE FULL-SCREEN MODAL WITH AUDIO ON & PORTAL */}
      {modalStyle &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn"
            onClick={closeFullscreenModal}
          >
            {/* Outside floating Close button for convenience on desktop */}
            <button
              type="button"
              onClick={closeFullscreenModal}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/20 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl backdrop-blur-md border border-white/25 z-50 hover:scale-105 active:scale-95"
              title="Close (Esc)"
              aria-label="Close"
            >
              <X size={22} strokeWidth={2.5} />
            </button>

            {/* Compact Reels / Phone-style Vertical Video Frame */}
            <div
              className="relative aspect-[9/16] h-auto max-h-[85vh] sm:max-h-[80vh] w-auto max-w-[92vw] sm:max-w-[390px] rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/20 flex flex-col justify-between group"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Actual Video */}
              <video
                ref={modalVideoRef}
                src={modalStyle.videoSrc}
                poster={modalStyle.posterSrc}
                autoPlay
                playsInline
                loop
                muted={modalMuted}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                onClick={toggleModalPlay}
              />

              {/* Play/Pause Center Indicator */}
              {!modalPlaying && (
                <div
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/90 text-[#93611D] flex items-center justify-center shadow-2xl cursor-pointer z-20 pointer-events-none"
                >
                  <Play size={28} className="fill-[#93611D] ml-1" />
                </div>
              )}

              {/* Top Bar Overlaid directly on video */}
              <div className="relative z-30 p-3.5 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
                <div className="flex items-center space-x-2">
                  <span className="font-serif text-sm sm:text-base font-bold text-white drop-shadow-md">
                    {modalStyle.name}
                  </span>
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${modalStyle.badgeColor}`}>
                    {modalStyle.badge}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Sound Toggle */}
                  <button
                    type="button"
                    onClick={() => setModalMuted(!modalMuted)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/50 hover:bg-black/70 text-white border border-white/25 transition-all cursor-pointer backdrop-blur-md"
                    title={modalMuted ? "Unmute audio" : "Mute audio"}
                  >
                    {modalMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-[#D4AF37]" />}
                    <span>{modalMuted ? "Muted" : "Sound On"}</span>
                  </button>

                  {/* Top-Right (X) Inside Video */}
                  <button
                    type="button"
                    onClick={closeFullscreenModal}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer border border-white/25 shadow-md"
                    title="Close preview"
                    aria-label="Close preview"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Bottom Bar Overlaid directly on video */}
              <div className="relative z-30 p-3.5 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStyle === modalStyle.name) {
                      onClearStyle();
                    } else {
                      onSelectStyle(modalStyle.name);
                    }
                  }}
                  className={`w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg ${
                    selectedStyle === modalStyle.name
                      ? "bg-[#D4AF37] text-white hover:brightness-105 ring-2 ring-white/50"
                      : "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white hover:brightness-110 active:scale-98"
                  }`}
                >
                  {selectedStyle === modalStyle.name ? (
                    <>
                      <Check size={16} strokeWidth={3} />
                      <span>Selected as Wedding Video ✓</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Select {modalStyle.name} Style</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-white/70">
                  Tap anywhere outside or (X) to close
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
