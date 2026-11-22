import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Music,
  Volume2,
  VolumeX,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Flower2,
  CheckCircle2,
  Flame,
  Camera,
  Play,
  Maximize
} from "lucide-react";
import "./RoyalGold.css";

/**
 * ROYAL GOLD - Luxury Indian Wedding Invitation Website Template
 * WebRyza Cards Studio
 *
 * @param {Object} props
 * @param {Object} props.data - Dynamic wedding data payload
 */
export default function RoyalGold({ data = {} }) {
  // Safe field extractions with fallbacks
  const brideName = (data.brideName || "The Bride").trim();
  const groomName = (data.groomName || "The Groom").trim();
  const weddingDateStr = data.weddingDate || "";
  const weddingTimeStr = data.weddingTime || "";
  const venueName = (data.venueName || "Grand Palace Hall").trim();
  const venueAddress = (data.venueAddress || "").trim();
  const googleMapsLink = data.googleMapsLink || (venueAddress ? `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}` : "");
  
  // Normalize Parents (supports object { father, mother } or string)
  const formatParents = (parents) => {
    if (!parents) return "";
    if (typeof parents === "string") return parents.trim();
    if (typeof parents === "object") {
      const parts = [];
      if (parents.mother) parts.push(parents.mother.trim());
      if (parents.father) parts.push(parents.father.trim());
      return parts.join(" & ");
    }
    return "";
  };

  const brideParentsFormatted = formatParents(data.brideParents);
  const groomParentsFormatted = formatParents(data.groomParents);

  const events = Array.isArray(data.events) && data.events.length > 0
    ? data.events
    : (venueName || weddingDateStr)
      ? [
          {
            name: "The Wedding Celebration",
            date: weddingDateStr,
            time: weddingTimeStr,
            venue: venueName,
            address: venueAddress,
            mapLink: googleMapsLink,
            description: data.invitationNote || data.additionalDetails || "We look forward to celebrating this joyful moment with you."
          }
        ]
      : [];
  const galleryImages = Array.isArray(data.galleryImages) ? data.galleryImages : [];
  const videoUrl = (data.videoUrl || "/templates/temple-heritage/marriage_video.mp4").trim();

  // State: Lightbox modal
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // State: Background Music
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [audioNotice, setAudioNotice] = useState(false);
  const audioRef = useRef(null);

  // State: Share / Toast feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // State & Ref: Automatic video playback on section scroll with pause & resume
  const videoSectionRef = useRef(null);
  const videoElementRef = useRef(null);
  const iframeRef = useRef(null);
  const [hasVideoLoaded, setHasVideoLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Play music on first interaction anywhere on the page
  useEffect(() => {
    const startAudioOnFirstClick = () => {
      if (audioRef.current && !isMusicPlaying) {
        audioRef.current
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener("click", startAudioOnFirstClick, { once: true });
    window.addEventListener("touchstart", startAudioOnFirstClick, { once: true });

    return () => {
      window.removeEventListener("click", startAudioOnFirstClick);
      window.removeEventListener("touchstart", startAudioOnFirstClick);
    };
  }, [isMusicPlaying]);

  // Fullscreen state listener: enforces 9:16 aspect ratio when in fullscreen
  useEffect(() => {
    const onFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!videoElementRef.current) return;
    const elem = videoElementRef.current;
    const isCurrentlyFs = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    if (!isCurrentlyFs) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Play / Pause controller that resumes seamlessly where it stopped
  const controlPlayback = (shouldPlay) => {
    setIsVideoPlaying(shouldPlay);

    // 1. Direct HTML5 Video
    if (videoElementRef.current) {
      if (shouldPlay) {
        if (audioRef.current && isMusicPlaying) {
          audioRef.current.pause();
        }
        videoElementRef.current.muted = false;
        videoElementRef.current.play().catch(() => {});
      } else {
        videoElementRef.current.pause();
        if (audioRef.current && isMusicPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    }

    // 2. YouTube / Vimeo Iframe via postMessage API (resumes from current timestamp)
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        if (shouldPlay) {
          // YouTube play command
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: "" }),
            "*"
          );
          // Vimeo play command
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: "play" }),
            "*"
          );
        } else {
          // YouTube pause command
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
            "*"
          );
          // Vimeo pause command
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: "pause" }),
            "*"
          );
        }
      } catch (e) {
        // Cross-origin message safety
      }
    }
  };

  // IntersectionObserver: Pause when scrolling away, resume where stopped when returning
  useEffect(() => {
    if (!videoSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setHasVideoLoaded(true);
          controlPlayback(true);
        } else {
          controlPlayback(false);
        }
      },
      {
        threshold: 0.3, // Trigger when 30% of the section is visible
      }
    );

    observer.observe(videoSectionRef.current);
    return () => observer.disconnect();
  }, [hasVideoLoaded]);

  // Helper: Format Date nicely
  const formatDatePretty = (dateStr) => {
    if (!dateStr) return "";
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      if (!year || !month || !day) return dateStr;
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // --------------------------------------------------------------------------
  // Countdown Timer Calculation
  // --------------------------------------------------------------------------
  const targetDate = useMemo(() => {
    if (!weddingDateStr) return null;
    try {
      const [year, month, day] = weddingDateStr.split("-").map(Number);
      let hours = 10;
      let minutes = 30;

      if (weddingTimeStr) {
        const timeMatch = weddingTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
          hours = parseInt(timeMatch[1], 10);
          minutes = parseInt(timeMatch[2], 10);
          const mer = (timeMatch[3] || "").toUpperCase();
          if (mer === "PM" && hours < 12) hours += 12;
          if (mer === "AM" && hours === 12) hours = 0;
        }
      }

      return new Date(year, month - 1, day, hours, minutes, 0);
    } catch {
      return null;
    }
  }, [weddingDateStr, weddingTimeStr]);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculate = () => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Handle Share / Copy Invitation Link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Toggle ambient wedding melody
  const handleToggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsMusicPlaying(true);
        })
        .catch(() => {
          setIsMusicPlaying(false);
        });
    }
    setAudioNotice(true);
    setTimeout(() => setAudioNotice(false), 3000);
  };

  // Parse embeddable video URL (YouTube, Vimeo, direct mp4) with automatic playback on scroll
  const embedVideoUrl = useMemo(() => {
    if (!videoUrl) return null;

    // Load with autoplay parameters once section becomes visible
    const autoplayParam = hasVideoLoaded ? "1" : "0";
    const ytParams = `autoplay=${autoplayParam}&mute=0&playsinline=1&enablejsapi=1&rel=0`;

    if (videoUrl.includes("youtube.com/watch")) {
      const videoId = new URL(videoUrl).searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}?${ytParams}` : null;
    }
    if (videoUrl.includes("youtu.be/")) {
      const parts = videoUrl.split("youtu.be/");
      const videoId = parts[1]?.split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?${ytParams}` : null;
    }
    if (videoUrl.includes("vimeo.com/")) {
      const videoId = videoUrl.split("vimeo.com/")[1]?.split("?")[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=${autoplayParam}&muted=0` : null;
    }
    return videoUrl; // Direct video or already an embed URL
  }, [videoUrl, hasVideoLoaded]);

  return (
    <div className="rg-royal-wrapper">
      {/* Audio element for Royal Gold template */}
      <audio ref={audioRef} loop src="/templates/temple-heritage/tabala_flute.mp3" preload="auto" />
      {/* =====================================================================
          FLOATING AMBIENT AUDIO & SHARE CONTROLS
          ===================================================================== */}
      <div className="rg-floating-audio" onClick={handleToggleMusic} title="Toggle Celebration Music">
        {isMusicPlaying ? (
          <Volume2 size={20} className="rg-audio-spin text-[#FDF7B8]" />
        ) : (
          <VolumeX size={20} className="text-[#C5A059]" />
        )}
      </div>

      {audioNotice && (
        <div className="fixed bottom-20 left-6 z-50 bg-[#38020E]/90 text-[#FDFBF7] text-xs px-3.5 py-2 rounded-full border border-[#D4AF37]/50 shadow-lg backdrop-blur-md transition-all">
          {isMusicPlaying ? "♫ Wedding Shehnai & Sitar Melody Playing" : "Audio Muted"}
        </div>
      )}

      {/* Floating Share Button */}
      <button
        type="button"
        onClick={handleShare}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#580B1C] text-[#FFFDF7] border border-[#D4AF37] shadow-xl hover:brightness-110 active:scale-95 transition-all text-xs font-semibold tracking-wider uppercase"
      >
        <Share2 size={14} className="text-[#FDF7B8]" />
        <span>{copiedLink ? "Link Copied!" : "Share Invite"}</span>
      </button>

      {/* Fixed Ambient Floral Accents on Screen Edges (Tablet & Laptop) */}
      <div className="rg-page-side-florals" aria-hidden="true">
        <img
          src="/templates/royal-gold/images/floral_left_vine.png"
          alt=""
          className="rg-fixed-floral-left"
        />
        <img
          src="/templates/royal-gold/images/floral_top_right.png"
          alt=""
          className="rg-fixed-floral-right"
        />
      </div>

      {/* =====================================================================
          1. HERO SECTION: Royal Palace Grand First Impression
          ===================================================================== */}
      <section className="rg-hero-container">
        <div className="rg-hero-bg" />

        {/* Responsive Floral Frame (Top Right, Left Vine, Bottom Right - Matching Uploaded Design) */}
        <div className="rg-hero-floral-frame" aria-hidden="true">
          <img
            src="/templates/royal-gold/images/floral_top_right.png"
            alt=""
            className="rg-floral-tr"
          />
          <img
            src="/templates/royal-gold/images/floral_left_vine.png"
            alt=""
            className="rg-floral-left"
          />
          <img
            src="/templates/royal-gold/images/floral_bottom_right.png"
            alt=""
            className="rg-floral-br"
          />
        </div>

        {/* Decorative Rotating Mandala Watermark */}
        <div className="rg-hero-mandala-bg">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#8B6514] stroke-[0.4]">
            <circle cx="50" cy="50" r="48" />
            <circle cx="50" cy="50" r="40" />
            <circle cx="50" cy="50" r="32" />
            <circle cx="50" cy="50" r="24" />
            <circle cx="50" cy="50" r="16" />
            <path d="M50 2 L50 98 M2 50 L98 50 M16 16 L84 84 M16 84 L84 16" />
            <polygon points="50,10 62,38 90,50 62,62 50,90 38,62 10,50 38,38" />
            <polygon points="50,18 58,42 82,50 58,58 50,82 42,58 18,50 42,42" />
          </svg>
        </div>

        {/* Main Royal Palace Arch Frame */}
        <div className="rg-hero-arch-frame">
          {/* Heading */}
          <p className="rg-hero-celebration-title">
            The Wedding Celebration Of
          </p>

          {/* Couple Names */}
          <div className="my-4 sm:my-6">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold rg-display text-[#38020E] tracking-tight leading-none mb-1">
              {brideName}
            </h1>

            {/* Decorative Divider with Traditional Ambi / Lotus */}
            <div className="flex items-center justify-center gap-4 my-2 sm:my-3">
              <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
              <div className="flex items-center gap-1.5 text-[#8B6514]">
                <Flower2 size={18} className="text-[#580B1C]" />
                <span className="text-2xl sm:text-3xl font-serif text-[#C5A059] italic px-1">&</span>
                <Flower2 size={18} className="text-[#580B1C]" />
              </div>
              <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold rg-display text-[#38020E] tracking-tight leading-none mt-1">
              {groomName}
            </h1>
          </div>

          {/* Wedding Date Display */}
          <div className="mt-6 sm:mt-8 pt-5 border-t border-[#D4AF37]/30 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-[#580B1C] tracking-wide">
              <Calendar size={16} className="text-[#8B6514]" />
              <span>{formatDatePretty(weddingDateStr) || "February 15, 2027"}</span>
            </div>

            {weddingTimeStr && (
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#5C5247] mt-1 font-medium">
                <Clock size={14} className="text-[#8B6514]" />
                <span>Muhurtham at {weddingTimeStr}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-[#5C5247] mt-1 font-medium">
              <MapPin size={13} className="text-[#8B6514]" />
              <span>{venueName}</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="rg-scroll-indicator">
          <div className="rg-mouse-icon">
            <div className="rg-wheel" />
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#8B6514] font-semibold">
            Scroll To Discover
          </span>
        </div>
      </section>

      {/* =====================================================================
          2. WELCOME / INVITATION SECTION: Traditional Blessings & Invitation
          ===================================================================== */}
      <section className="py-20 px-4 max-w-4xl mx-auto relative z-10 text-center">
        {/* Sanskrit Auspicious Invocation */}
        <div className="mb-4">
          <p className="text-xs sm:text-sm font-serif italic text-[#8B6514] tracking-wider">
            ॥ श्री गणेशाय नमः ॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ॥
          </p>
        </div>

        <div className="rg-palace-card p-8 sm:p-14 relative">
          <div className="rg-corner-bracket rg-corner-tl" />
          <div className="rg-corner-bracket rg-corner-tr" />
          <div className="rg-corner-bracket rg-corner-bl" />
          <div className="rg-corner-bracket rg-corner-br" />

          {/* Small emblem */}
          <div className="w-12 h-12 rounded-full border border-[#D4AF37] mx-auto flex items-center justify-center mb-6 bg-[#FAF7F0] text-[#580B1C]">
            <Heart size={20} fill="#580B1C" className="text-[#580B1C]" />
          </div>

          <h2 className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[#8B6514] font-bold mb-3">
            Cordially Invite You
          </h2>

          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold rg-display text-[#38020E] mb-6">
            Together With Our Families
          </h3>

          <p className="text-sm sm:text-base text-[#5C5247] leading-relaxed max-w-2xl mx-auto mb-8">
            With the divine blessings of the Almighty and our respected elders, we invite you to honor us with your
            presence, love, and heartfelt blessings as our beloved children embark upon their sacred journey of eternal togetherness.
          </p>

          {/* Symmetrical Family Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#D4AF37]/30 text-center">
            {/* Bride Side */}
            <div className="p-4 rounded-xl bg-[#FAF7F0]/60 border border-[#D4AF37]/25">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8B6514] block mb-1">
                Bride's Family
              </span>
              <h4 className="text-xl sm:text-2xl font-bold rg-display text-[#38020E] mb-1">
                {brideName}
              </h4>
              {brideParentsFormatted && (
                <p className="text-xs sm:text-sm text-[#5C5247] mt-1">
                  Daughter of <br />
                  <span className="font-semibold text-[#231C16]">{brideParentsFormatted}</span>
                </p>
              )}
            </div>

            {/* Groom Side */}
            <div className="p-4 rounded-xl bg-[#FAF7F0]/60 border border-[#D4AF37]/25">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8B6514] block mb-1">
                Groom's Family
              </span>
              <h4 className="text-xl sm:text-2xl font-bold rg-display text-[#38020E] mb-1">
                {groomName}
              </h4>
              {groomParentsFormatted && (
                <p className="text-xs sm:text-sm text-[#5C5247] mt-1">
                  Son of <br />
                  <span className="font-semibold text-[#231C16]">{groomParentsFormatted}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. WEDDING COUNTDOWN TIMER
          ===================================================================== */}
      <section className="py-16 px-4 max-w-4xl mx-auto relative z-10 text-center">
        <div className="rg-palace-card p-8 sm:p-12">
          <div className="rg-corner-bracket rg-corner-tl" />
          <div className="rg-corner-bracket rg-corner-tr" />
          <div className="rg-corner-bracket rg-corner-bl" />
          <div className="rg-corner-bracket rg-corner-br" />

          <p className="text-xs uppercase tracking-[0.3em] text-[#8B6514] font-bold mb-2">Auspicious Countdown</p>
          <h2 className="text-2xl sm:text-4xl font-bold rg-display text-[#38020E] mb-8">
            Counting Down To Our Forever
          </h2>

          {timeLeft.isPast ? (
            <div className="p-6 rounded-2xl bg-[#580B1C]/5 border border-[#D4AF37]/40 max-w-md mx-auto">
              <CheckCircle2 size={32} className="text-[#8B6514] mx-auto mb-2" />
              <h3 className="text-xl font-bold rg-display text-[#38020E]">The Celebrations Have Commenced!</h3>
              <p className="text-xs sm:text-sm text-[#5C5247] mt-1">
                Thank you for blessing our sacred wedding day with your heartfelt prayers and love.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 sm:gap-6 max-w-xl mx-auto">
              <div className="rg-countdown-item">
                <span className="text-2xl sm:text-4xl md:text-5xl font-bold rg-display text-[#38020E] block">
                  {String(timeLeft.days).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8B6514] font-bold mt-1 block">
                  Days
                </span>
              </div>

              <div className="rg-countdown-item">
                <span className="text-2xl sm:text-4xl md:text-5xl font-bold rg-display text-[#38020E] block">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8B6514] font-bold mt-1 block">
                  Hours
                </span>
              </div>

              <div className="rg-countdown-item">
                <span className="text-2xl sm:text-4xl md:text-5xl font-bold rg-display text-[#38020E] block">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8B6514] font-bold mt-1 block">
                  Minutes
                </span>
              </div>

              <div className="rg-countdown-item">
                <span className="text-2xl sm:text-4xl md:text-5xl font-bold rg-display text-[#38020E] block">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8B6514] font-bold mt-1 block">
                  Seconds
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          5. WEDDING EVENTS ITINERARY (DYNAMIC EVENTS)
          ===================================================================== */}
      {events.length > 0 && (
        <section className="py-20 px-4 max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B6514] font-bold mb-2">Celebration Schedule</p>
            <h2 className="text-3xl sm:text-5xl font-bold rg-display text-[#38020E]">Wedding Ceremonies</h2>
            <p className="text-xs sm:text-sm text-[#5C5247] mt-2">Join us across our auspicious wedding festivities</p>
            <div className="h-0.5 w-16 bg-[#C5A059] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {events.map((ev, idx) => {
              const eventMapLink = ev.mapLink || ev.locationLink || (ev.address ? `https://maps.google.com/?q=${encodeURIComponent(`${ev.venue || ""} ${ev.address}`)}` : "");
              return (
                <div key={idx} className="rg-palace-card p-6 sm:p-7 flex flex-col justify-between">
                  <div>
                    {/* Event Tag & Icon */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D4AF37]/25">
                      <div className="w-10 h-10 rounded-full bg-[#580B1C]/8 border border-[#D4AF37]/40 flex items-center justify-center text-[#580B1C]">
                        {idx % 3 === 0 ? <Flame size={18} /> : idx % 3 === 1 ? <Music size={18} /> : <Heart size={18} />}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-[#D4AF37]/50 text-[#8B6514]">
                        Event 0{idx + 1}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold rg-display text-[#38020E] mb-3">
                      {ev.name || ev.eventName || `Ceremony ${idx + 1}`}
                    </h3>

                    {/* Date & Time */}
                    <div className="space-y-2 mb-4 text-xs text-[#5C5247]">
                      {ev.date && (
                        <div className="flex items-center gap-2 font-semibold text-[#231C16]">
                          <Calendar size={14} className="text-[#8B6514] shrink-0" />
                          <span>{formatDatePretty(ev.date)}</span>
                        </div>
                      )}
                      {ev.time && (
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-[#8B6514] shrink-0" />
                          <span>{ev.time}</span>
                        </div>
                      )}
                      {(ev.venue || ev.venueName) && (
                        <div className="flex items-start gap-2 pt-1 border-t border-[#D4AF37]/15">
                          <MapPin size={14} className="text-[#8B6514] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#231C16] block">{ev.venue || ev.venueName}</span>
                            {(ev.address || ev.venueAddress) && (
                              <span className="text-[11px] text-[#5C5247] block mt-0.5">
                                {ev.address || ev.venueAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {ev.description && (
                      <p className="text-xs text-[#5C5247] italic mb-5 leading-relaxed bg-[#FAF7F0]/60 p-2.5 rounded-lg border border-[#D4AF37]/20">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Google Maps Button */}
                  {eventMapLink && (
                    <a
                      href={eventMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#580B1C] bg-[#FAF7F0] border border-[#D4AF37] hover:bg-[#580B1C] hover:text-[#FFFDF7] transition-all"
                    >
                      <MapPin size={13} />
                      <span>View Location Map</span>
                      <ExternalLink size={12} className="opacity-70" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================================
          6. VENUE SECTION: Main Wedding Palace & Directions
          ===================================================================== */}
      <section className="py-16 px-4 max-w-4xl mx-auto relative z-10 text-center">
        <div className="rg-palace-card p-8 sm:p-14">
          <div className="rg-corner-bracket rg-corner-tl" />
          <div className="rg-corner-bracket rg-corner-tr" />
          <div className="rg-corner-bracket rg-corner-bl" />
          <div className="rg-corner-bracket rg-corner-br" />

          <div className="w-12 h-12 rounded-full border border-[#D4AF37] mx-auto flex items-center justify-center mb-5 bg-[#FAF7F0] text-[#580B1C]">
            <MapPin size={22} className="text-[#8B6514]" />
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-[#8B6514] font-bold mb-2">The Destination</p>
          <h2 className="text-3xl sm:text-4xl font-bold rg-display text-[#38020E] mb-3">
            Wedding Venue
          </h2>

          <h3 className="text-xl sm:text-2xl font-bold text-[#231C16] mb-2">{venueName}</h3>
          {venueAddress && (
            <p className="text-sm text-[#5C5247] max-w-lg mx-auto leading-relaxed mb-6">
              {venueAddress}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#580B1C] mb-8">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F0] border border-[#D4AF37]/40">
              <Calendar size={13} className="text-[#8B6514]" />
              {formatDatePretty(weddingDateStr) || "February 15, 2027"}
            </span>
            {weddingTimeStr && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F0] border border-[#D4AF37]/40">
                <Clock size={13} className="text-[#8B6514]" />
                {weddingTimeStr}
              </span>
            )}
          </div>

          {googleMapsLink && (
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full rg-gold-btn text-xs"
            >
              <MapPin size={15} />
              <span>Get Directions On Google Maps</span>
              <ExternalLink size={14} className="opacity-80" />
            </a>
          )}
        </div>
      </section>

      {/* =====================================================================
          6. WELCOME VIDEO / AI INVITATION SECTION (AUTOPLAY & RESUME ON SCROLL)
          ===================================================================== */}
      {Boolean(videoUrl && embedVideoUrl) && (
        <section ref={videoSectionRef} className="py-20 px-4 max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B6514] font-bold mb-2">
              A Special Welcome Message
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold rg-display text-[#38020E]">
              Welcome To Our Wedding
            </h2>
            <p className="text-xs sm:text-sm text-[#5C5247] mt-2 max-w-md mx-auto">
              A personal video greeting and heartfelt invitation from the bride and groom
            </p>
            <div className="h-0.5 w-16 bg-[#C5A059] mx-auto mt-4" />
          </div>

          <div className="rg-video-container-9-16">
            <div className="rg-palace-card p-3 sm:p-5 overflow-hidden">
              <div className="rg-video-wrapper-9-16">
                {embedVideoUrl.endsWith(".mp4") || embedVideoUrl.endsWith(".webm") ? (
                  <>
                    <video
                      ref={videoElementRef}
                      playsInline
                      autoPlay
                      muted={isVideoMuted}
                      controls
                      className={`w-full h-full ${isFullscreen ? "object-contain bg-black" : "object-cover"}`}
                      style={
                        isFullscreen
                          ? { objectFit: "contain", backgroundColor: "#000", width: "100%", height: "100%" }
                          : {}
                      }
                    >
                      <source src={embedVideoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="rg-video-top-controls">
                      <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className="rg-video-fs-btn"
                        title="Fullscreen 9:16 Video"
                      >
                        <Maximize size={13} />
                        <span>Fullscreen</span>
                      </button>
                      {isVideoMuted && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsVideoMuted(false);
                            if (videoElementRef.current) {
                              videoElementRef.current.muted = false;
                            }
                          }}
                          className="rg-video-sound-pill"
                        >
                          <VolumeX size={14} className="text-[#D4AF37]" />
                          <span>Tap for Sound</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <iframe
                    ref={iframeRef}
                    src={embedVideoUrl}
                    title="Welcome To Our Wedding"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>

              {/* Smart Scroll Playback Status Indicator */}
              <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-[#8B6514]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className={`w-2 h-2 rounded-full transition-colors ${isVideoPlaying ? "bg-emerald-500 animate-pulse" : "bg-[#8B6514]/60"}`} />
                  <span>{isVideoPlaying ? "Playing welcome video" : "Paused • Resumes as you scroll"}</span>
                </span>
                <span className="text-[#5C5247] hidden sm:inline text-[10px]">Auto-scroll active</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          8. PHOTO GALLERY SECTION
          ===================================================================== */}
      {galleryImages.length > 0 && (
        <section className="py-20 px-4 max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B6514] font-bold mb-2">Captured Moments</p>
            <h2 className="text-3xl sm:text-5xl font-bold rg-display text-[#38020E]">Photo Gallery</h2>
            <p className="text-xs sm:text-sm text-[#5C5247] mt-2">Glimpses of love, laughter, and timeless heritage</p>
            <div className="h-0.5 w-16 bg-[#C5A059] mx-auto mt-4" />
          </div>

          {/* Dynamic Grid Layout based on uploaded image count */}
          <div
            className={
              galleryImages.length === 1
                ? "max-w-md mx-auto"
                : galleryImages.length === 2
                ? "grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-4 sm:gap-6"
                : galleryImages.length === 3
                ? "grid grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto gap-4 sm:gap-6"
                : galleryImages.length === 4
                ? "grid grid-cols-2 max-w-3xl mx-auto gap-4 sm:gap-6"
                : "grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6"
            }
          >
            {galleryImages.map((imgUrl, i) => (
              <div
                key={i}
                onClick={() => setActivePhotoIndex(i)}
                className={`group relative ${
                  galleryImages.length === 1 ? "aspect-[4/5] sm:aspect-square" : "aspect-square"
                } rounded-2xl overflow-hidden cursor-pointer border border-[#D4AF37]/50 shadow-md bg-[#FAF7F0]`}
              >
                <img
                  src={imgUrl}
                  alt={`Wedding Moment ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#38020E]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs text-[#FFFDF7] font-semibold flex items-center gap-1.5">
                    <Camera size={14} className="text-[#D4AF37]" />
                    <span>View Image</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {activePhotoIndex !== null && galleryImages[activePhotoIndex] && (
        <div className="rg-lightbox-backdrop" onClick={() => setActivePhotoIndex(null)}>
          <div className="rg-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActivePhotoIndex(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-[#D4AF37] transition-colors"
            >
              <X size={28} />
            </button>

            <img
              src={galleryImages[activePhotoIndex]}
              alt={`Gallery ${activePhotoIndex + 1}`}
              className="rg-lightbox-img"
            />

            {/* Navigation buttons */}
            <div className="flex items-center justify-between w-full mt-4 px-2">
              <button
                type="button"
                onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                className="p-2.5 rounded-full bg-white/10 text-white hover:bg-[#D4AF37] hover:text-[#38020E] transition-all"
              >
                <ChevronLeft size={22} />
              </button>
              <span className="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">
                {activePhotoIndex + 1} of {galleryImages.length}
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                className="p-2.5 rounded-full bg-white/10 text-white hover:bg-[#D4AF37] hover:text-[#38020E] transition-all"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. FINAL BLESSINGS & CLOSING SECTION
          ===================================================================== */}
      <section className="py-24 px-4 max-w-4xl mx-auto relative z-10 text-center">
        <div className="rg-palace-card p-10 sm:p-16">
          <div className="rg-corner-bracket rg-corner-tl" />
          <div className="rg-corner-bracket rg-corner-tr" />
          <div className="rg-corner-bracket rg-corner-bl" />
          <div className="rg-corner-bracket rg-corner-br" />

          {/* Traditional Auspicious Diya / Kalash Icon */}
          <div className="w-14 h-14 rounded-full border border-[#D4AF37] mx-auto flex items-center justify-center mb-6 bg-[#FAF7F0] text-[#580B1C]">
            <Flower2 size={26} className="text-[#8B6514]" />
          </div>

          <p className="text-xs uppercase tracking-[0.35em] text-[#8B6514] font-bold mb-3">With Love & Gratitude</p>

          <h2 className="text-3xl sm:text-5xl font-bold rg-display text-[#38020E] mb-6">
            Your Presence Is Our Greatest Gift
          </h2>

          <p className="text-sm sm:text-base text-[#5C5247] leading-relaxed max-w-xl mx-auto mb-8">
            As we celebrate this auspicious union of two hearts and two families, we cherish nothing more than your gracious presence, prayers, and blessings on our wedding day.
          </p>

          <div className="my-6">
            <span className="text-2xl sm:text-3xl font-bold rg-script text-[#580B1C]">
              {brideName} & {groomName}
            </span>
          </div>

          {/* Subtle Royal Footer Credit */}
          <div className="pt-8 border-t border-[#D4AF37]/30 text-[11px] text-[#8B6514] font-medium tracking-wider">
            WebRyza Royal Invitations • Made with Love & Heritage
          </div>
        </div>
      </section>
    </div>
  );
}
