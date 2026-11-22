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
  Maximize,
  Compass,
  Check
} from "lucide-react";
import "./ElegantPastel.css";

/**
 * ELEGANT PASTEL ROMANCE - Modern Luxury Wedding Invitation Website Template
 * WebRyza Cards Studio • Digital Wedding Invitations
 *
 * @param {Object} props
 * @param {Object} props.data - Dynamic wedding data payload conforming to schema
 */
export default function ElegantPastel({ data = {} }) {
  // Safe field extractions with elegant fallbacks
  const brideName = (data.brideName || "Ananya").trim();
  const groomName = (data.groomName || "Arjun").trim();
  const weddingDateStr = data.weddingDate || "2027-03-20";
  const weddingTimeStr = data.weddingTime || "10:30 AM";
  const venueName = (data.venueName || "The Grand Rosewood Pavilion").trim();
  const venueAddress = (data.venueAddress || "Alipiri Foothills Road, Tirupati, Andhra Pradesh").trim();
  const googleMapsLink = data.googleMapsLink || (venueAddress ? `https://maps.google.com/?q=${encodeURIComponent(`${venueName} ${venueAddress}`)}` : "");

  // Parent normalization
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

  const brideParentsStr = formatParents(data.brideParents);
  const groomParentsStr = formatParents(data.groomParents);

  // Photographs
  const heroImage = data.heroImage || data.coupleImage || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85";
  const brideImage = data.brideImage || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=85";
  const groomImage = data.groomImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85";
  const venueImage = data.venueImage || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85";

  // Descriptions
  const brideDescription = (data.brideDescription || data.brideBio || "Architect, contemporary artist, and lover of timeless literature whose gentle warmth and radiant laughter illuminate every room.").trim();
  const groomDescription = (data.groomDescription || data.groomBio || "Creative director, classical pianist, and avid mountaineer whose steady presence and deep kindness bring tranquility to every heartbeat.").trim();
  const invitationNote = (data.invitationNote || "With profound gratitude for the love that has guided our paths and the cherished blessings of our families, we joyfully invite you to celebrate the beginning of our new chapter together.").trim();

  // Arrays
  const galleryImages = Array.isArray(data.galleryImages) && data.galleryImages.length > 0
    ? data.galleryImages
    : [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80"
      ];

  const events = Array.isArray(data.events) ? data.events : [];
  const videoUrl = (data.videoUrl || "").trim();

  // UI Interactive States
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Video Autoplay & Fullscreen States
  const videoSectionRef = useRef(null);
  const videoElementRef = useRef(null);
  const iframeRef = useRef(null);
  const [hasVideoLoaded, setHasVideoLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio Ref
  const audioRef = useRef(null);

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

  // --------------------------------------------------------------------------
  // 1. DATE FORMATTING & COUNTDOWN
  // --------------------------------------------------------------------------
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
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

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

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

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
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  // --------------------------------------------------------------------------
  // 2. VIDEO EMBEDDING & SCROLL PLAYBACK
  // --------------------------------------------------------------------------
  const embedVideoUrl = useMemo(() => {
    if (!videoUrl) return null;
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
    return videoUrl;
  }, [videoUrl, hasVideoLoaded]);

  const controlPlayback = (shouldPlay) => {
    setIsVideoPlaying(shouldPlay);

    // 1. Direct Video
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

    // 2. Iframe postMessage
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        if (shouldPlay) {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo" }), "*");
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*");
        } else {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: "command", func: "pauseVideo" }), "*");
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "pause" }), "*");
        }
      } catch {
        // Cross-origin safe
      }
    }
  };

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
      { threshold: 0.35 }
    );
    observer.observe(videoSectionRef.current);
    return () => observer.disconnect();
  }, [hasVideoLoaded]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
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
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // --------------------------------------------------------------------------
  // 3. LIGHTBOX KEYBOARD SHORTCUTS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePhotoIndex === null) return;
      if (e.key === "Escape") setActivePhotoIndex(null);
      if (e.key === "ArrowLeft") {
        setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
      }
      if (e.key === "ArrowRight") {
        setActivePhotoIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoIndex, galleryImages.length]);

  // --------------------------------------------------------------------------
  // 4. MUSIC & SHARING CONTROLS
  // --------------------------------------------------------------------------
  const handleToggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(() => {
        setIsMusicPlaying(false);
      });
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  return (
    <div className="ep-page-wrapper">
      {/* Hidden audio element for ambient background music */}
      <audio ref={audioRef} loop src="/templates/temple-heritage/tabala_flute.mp3" preload="none" />

      {/* High-Visibility Floating Romantic Blossom Petals */}
      <div className="ep-floating-petals-container" aria-hidden="true">
        {[
          { left: "4%", delay: "0s", dur: "9.5s", size: 22, color: "#E05A74" },
          { left: "12%", delay: "3.2s", dur: "11.5s", size: 18, color: "#EB6880" },
          { left: "20%", delay: "1.0s", dur: "8.5s", size: 24, color: "#D8586F" },
          { left: "28%", delay: "4.8s", dur: "10.5s", size: 16, color: "#F07A90" },
          { left: "37%", delay: "2.2s", dur: "12s", size: 21, color: "#E88295" },
          { left: "45%", delay: "6.0s", dur: "9.8s", size: 25, color: "#E05A74" },
          { left: "54%", delay: "0.6s", dur: "11s", size: 19, color: "#D8586F" },
          { left: "63%", delay: "4.0s", dur: "9.2s", size: 23, color: "#EB6880" },
          { left: "72%", delay: "1.6s", dur: "10.8s", size: 17, color: "#F07A90" },
          { left: "80%", delay: "5.5s", dur: "12.5s", size: 22, color: "#E88295" },
          { left: "89%", delay: "2.8s", dur: "9.6s", size: 24, color: "#E05A74" },
          { left: "95%", delay: "6.8s", dur: "11.2s", size: 18, color: "#EB6880" },
        ].map((p, i) => (
          <svg
            key={i}
            className="ep-petal"
            style={{
              left: p.left,
              animationDuration: p.dur,
              animationDelay: p.delay,
              width: `${p.size}px`,
              height: `${p.size * 1.3}px`
            }}
            viewBox="0 0 24 32"
            fill="none"
          >
            <defs>
              <linearGradient id={`epPetalGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={p.color} stopOpacity="1" />
                <stop offset="55%" stopColor="#F791A6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFA6B8" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M12 2 C8 2 3.5 6.5 3.5 13.5 C3.5 20.5 8 27.5 12 30 C16 27.5 20.5 20.5 20.5 13.5 C20.5 6.5 16 2 12 2 Z"
              fill={`url(#epPetalGrad-${i})`}
              stroke="#D3526B"
              strokeWidth="0.6"
            />
          </svg>
        ))}
      </div>

      {/* Fixed Ambient Pastel Florals on Page Margins (Tablet & Laptop) */}
      <div className="ep-page-side-florals" aria-hidden="true">
        <img
          src="/templates/elegant-pastel/images/floral_tl_blossom.png"
          alt=""
          className="ep-fixed-blossom-left"
        />
        <img
          src="/templates/elegant-pastel/images/floral_br_blossom.png"
          alt=""
          className="ep-fixed-blossom-right"
        />
      </div>

      {/* Floating Music & Share Controls */}
      <aside className="ep-floating-controls" aria-label="Celebration Controls">
        <button
          type="button"
          onClick={handleToggleMusic}
          className="ep-pill-btn"
          title="Toggle Romantic Ambient Melody"
        >
          {isMusicPlaying ? (
            <>
              <div className="ep-sound-wave-bars">
                <span /><span /><span />
              </div>
              <span>Music Playing</span>
            </>
          ) : (
            <>
              <VolumeX size={14} className="text-[#B47674]" />
              <span>Play Music</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="ep-pill-btn"
          title="Share Invitation Link"
        >
          {copiedLink ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span>Link Copied</span>
            </>
          ) : (
            <>
              <Share2 size={13} className="text-[#8E8380]" />
              <span>Share Invite</span>
            </>
          )}
        </button>
      </aside>

      {/* =====================================================================
          1. HERO SECTION - EDITORIAL MAGAZINE COVER
          ===================================================================== */}
      <header className="ep-hero-section">
        {/* Watercolor Cherry Blossom & Gold Flourish Frame (Matching Uploaded Design) */}
        <div className="ep-floral-frame-overlay" aria-hidden="true">
          <img
            src="/templates/elegant-pastel/images/floral_tl_blossom.png"
            alt=""
            className="ep-floral-tl"
          />
          <img
            src="/templates/elegant-pastel/images/floral_tr_swirl.png"
            alt=""
            className="ep-floral-tr"
          />
          <img
            src="/templates/elegant-pastel/images/floral_bl_swirl.png"
            alt=""
            className="ep-floral-bl"
          />
          <img
            src="/templates/elegant-pastel/images/floral_br_blossom.png"
            alt=""
            className="ep-floral-br"
          />
        </div>

        <div className="ep-hero-inner">
          <div className="ep-hero-eyebrow">
            <span className="ep-eyebrow-line" />
            <span>Together with their families</span>
            <span className="ep-eyebrow-line" />
          </div>

          <h1 className="ep-hero-couple-title">
            <span>{brideName}</span>
            <span className="ep-hero-ampersand">&amp;</span>
            <span>{groomName}</span>
          </h1>

          <div className="ep-hero-date-banner">
            <span>{formatDatePretty(weddingDateStr)}</span>
            {weddingTimeStr && <span> • {weddingTimeStr}</span>}
          </div>

          {/* Large Romantic Editorial Frame */}
          <div className="ep-hero-editorial-frame">
            <img src={heroImage} alt={`${brideName} & ${groomName}`} className="ep-hero-img" />
            <div className="ep-hero-frame-caption">
              <span>A Modern Love Story</span>
              <span>{venueName}</span>
            </div>
          </div>

          {/* Animated Scroll Indicator */}
          <a href="#invitation" className="ep-scroll-cue">
            <span>Scroll to explore</span>
            <div className="ep-scroll-mouse">
              <div className="ep-scroll-mouse-wheel" />
            </div>
          </a>
        </div>
      </header>

      {/* =====================================================================
          2. INVITATION MESSAGE SECTION ("A BEAUTIFUL BEGINNING")
          ===================================================================== */}
      <section className="ep-section" id="invitation">
        <div className="ep-container-narrow">
          <div className="ep-card-editorial">
            {/* Subtle Floral Crest Icon */}
            <div className="ep-card-botanical-crest">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M24 6C24 6 27 15 33 18C39 21 44 24 44 24C44 24 38 27 33 30C28 33 24 42 24 42C24 42 20 33 15 30C10 27 4 24 4 24C4 24 9 21 15 18C21 15 24 6 24 6Z" />
                <circle cx="24" cy="24" r="5" fill="#F2DDD8" stroke="#B47674" />
              </svg>
            </div>

            <p className="ep-section-kicker">You are cordially invited</p>
            <h2 className="ep-section-title-serif">A Beautiful <em>Beginning</em></h2>

            <div className="ep-divider-motif">
              <Flower2 size={16} />
            </div>

            {/* Parents Honor Section */}
            {(brideParentsStr || groomParentsStr) && (
              <div className="ep-parents-box">
                {brideParentsStr && (
                  <div className="ep-parents-col">
                    <h4>Daughter of</h4>
                    <p className="ep-parents-names">{brideParentsStr}</p>
                  </div>
                )}
                {groomParentsStr && (
                  <div className="ep-parents-col">
                    <h4>Son of</h4>
                    <p className="ep-parents-names">{groomParentsStr}</p>
                  </div>
                )}
              </div>
            )}

            <p className="ep-invitation-prose">
              "{invitationNote}"
            </p>

            <div className="mt-8 pt-6 border-t border-[#D9C3AB]/30 flex flex-wrap items-center justify-center gap-6 text-xs text-[#5C524F] uppercase tracking-widest font-medium">
              <span>{formatDatePretty(weddingDateStr)}</span>
              <span>•</span>
              <span>{venueName}</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. OUR STORY / COUPLE SECTION
          ===================================================================== */}
      {Boolean((brideImage || groomImage || brideDescription || groomDescription) && data.showCoupleSection !== false) && (
        <section className="ep-section" id="story">
          <div className="ep-container-wide">
            <div className="text-center max-w-xl mx-auto mb-10">
              <p className="ep-section-kicker">Two Hearts, One Journey</p>
              <h2 className="ep-section-title-serif">The Happy <em>Couple</em></h2>
              <div className="ep-divider-motif">
                <Heart size={16} />
              </div>
            </div>

            <div className="ep-couple-grid">
              {/* The Bride Card */}
              <article className="ep-couple-card">
                {brideImage && (
                  <div className="ep-couple-img-wrapper">
                    <img src={brideImage} alt={brideName} className="ep-couple-img" />
                  </div>
                )}
                <span className="ep-couple-role-pill">The Bride</span>
                <div className="ep-couple-details">
                  <h3 className="ep-couple-person-name">{brideName}</h3>
                  {brideParentsStr && (
                    <p className="ep-couple-parents-sub">Daughter of {brideParentsStr}</p>
                  )}
                  {brideDescription && (
                    <p className="ep-couple-bio">"{brideDescription}"</p>
                  )}
                </div>
              </article>

              {/* The Groom Card */}
              <article className="ep-couple-card">
                {groomImage && (
                  <div className="ep-couple-img-wrapper">
                    <img src={groomImage} alt={groomName} className="ep-couple-img" />
                  </div>
                )}
                <span className="ep-couple-role-pill">The Groom</span>
                <div className="ep-couple-details">
                  <h3 className="ep-couple-person-name">{groomName}</h3>
                  {groomParentsStr && (
                    <p className="ep-couple-parents-sub">Son of {groomParentsStr}</p>
                  )}
                  {groomDescription && (
                    <p className="ep-couple-bio">"{groomDescription}"</p>
                  )}
                </div>
              </article>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          4. COUNTDOWN SECTION
          ===================================================================== */}
      <section className="ep-countdown-section" aria-label="Wedding Countdown">
        <div className="ep-container-narrow">
          <p className="ep-section-kicker">Anticipating Our Big Day</p>
          <h2 className="ep-section-title-serif">Counting Down to <em>Forever</em></h2>

          {timeLeft.isPast ? (
            <div className="ep-celebration-badge">
              <Sparkles size={18} className="text-[#B47674]" />
              <span className="font-serif text-lg text-[#2B2523] italic">
                Happily Married • A Lifetime of Love Begins
              </span>
            </div>
          ) : (
            <div className="ep-countdown-grid">
              <div className="ep-countdown-item">
                <span className="ep-countdown-num">{String(timeLeft.days).padStart(2, "0")}</span>
                <span className="ep-countdown-lbl">Days</span>
              </div>
              <div className="ep-countdown-item">
                <span className="ep-countdown-num">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="ep-countdown-lbl">Hours</span>
              </div>
              <div className="ep-countdown-item">
                <span className="ep-countdown-num">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="ep-countdown-lbl">Minutes</span>
              </div>
              <div className="ep-countdown-item">
                <span className="ep-countdown-num">{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="ep-countdown-lbl">Seconds</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          5. WEDDING EVENTS TIMELINE
          ===================================================================== */}
      {events.length > 0 && (
        <section className="ep-section" id="events">
          <div className="ep-container-wide">
            <div className="text-center max-w-xl mx-auto mb-8">
              <p className="ep-section-kicker">Celebration Itinerary</p>
              <h2 className="ep-section-title-serif">Wedding <em>Festivities</em></h2>
              <div className="ep-divider-motif">
                <Sparkles size={16} />
              </div>
            </div>

            <div className="ep-events-grid">
              {events.map((ev, idx) => {
                const mapLink = ev.mapLink || ev.locationLink || (ev.address ? `https://maps.google.com/?q=${encodeURIComponent(`${ev.venue || ""} ${ev.address}`)}` : "");
                return (
                  <div key={idx} className="ep-event-card">
                    <div>
                      <div className="ep-event-top">
                        <div className="ep-event-icon-badge">
                          <Flower2 size={20} />
                        </div>
                        <span className="ep-event-number-tag">Ceremony 0{idx + 1}</span>
                      </div>

                      <h3 className="ep-event-name">{ev.name || ev.eventName || `Ceremony ${idx + 1}`}</h3>

                      <div className="ep-event-meta-list">
                        {ev.date && (
                          <div className="ep-event-meta-item">
                            <Calendar size={15} />
                            <span>{formatDatePretty(ev.date)}</span>
                          </div>
                        )}
                        {ev.time && (
                          <div className="ep-event-meta-item">
                            <Clock size={15} />
                            <span>{ev.time}</span>
                          </div>
                        )}
                        {(ev.venue || ev.venueName) && (
                          <div className="ep-event-meta-item">
                            <MapPin size={15} />
                            <span>
                              <strong>{ev.venue || ev.venueName}</strong>
                              {(ev.address || ev.venueAddress) && ` — ${ev.address || ev.venueAddress}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {ev.description && (
                        <p className="ep-event-desc">"{ev.description}"</p>
                      )}
                    </div>

                    {mapLink && (
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ep-btn-map"
                      >
                        <Compass size={14} />
                        <span>View Location Map</span>
                        <ExternalLink size={12} className="opacity-70" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          6. WEDDING VENUE SECTION
          ===================================================================== */}
      <section className="ep-section" id="venue">
        <div className="ep-container-wide">
          <div className="text-center max-w-xl mx-auto mb-10">
            <p className="ep-section-kicker">The Destination</p>
            <h2 className="ep-section-title-serif">The Wedding <em>Venue</em></h2>
            <div className="ep-divider-motif">
              <MapPin size={16} />
            </div>
          </div>

          <div className="ep-venue-card">
            <div className="ep-venue-img-pane">
              <img src={venueImage} alt={venueName} className="ep-venue-img" />
            </div>

            <div className="ep-venue-info-pane">
              <span className="ep-section-kicker">Celebration Hall</span>
              <h3 className="ep-venue-name">{venueName}</h3>
              {venueAddress && <p className="ep-venue-address">{venueAddress}</p>}

              <div className="ep-venue-badges">
                <span className="ep-venue-badge">
                  <Calendar size={13} />
                  <span>{formatDatePretty(weddingDateStr)}</span>
                </span>
                {weddingTimeStr && (
                  <span className="ep-venue-badge">
                    <Clock size={13} />
                    <span>{weddingTimeStr}</span>
                  </span>
                )}
              </div>

              {googleMapsLink && (
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ep-btn-primary"
                >
                  <MapPin size={15} />
                  <span>Get Directions on Google Maps</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. WEDDING VIDEO (STRICT 9:16 VERTICAL CANVAS & SCROLL PLAYBACK)
          Rendered ONLY when videoUrl is present!
          ===================================================================== */}
      {Boolean(videoUrl && embedVideoUrl) && (
        <section ref={videoSectionRef} className="ep-section" id="video">
          <div className="ep-container-narrow">
            <div className="text-center max-w-xl mx-auto mb-8">
              <p className="ep-section-kicker">A Heartfelt Message</p>
              <h2 className="ep-section-title-serif">Welcome To Our <em>Wedding</em></h2>
              <p className="text-xs sm:text-sm text-[#5C524F] mt-2">
                A personal video greeting and invitation from {brideName} and {groomName}
              </p>
              <div className="ep-divider-motif">
                <Sparkles size={16} />
              </div>
            </div>

            <div className="ep-video-container-9-16">
              <div className="ep-video-card-frame">
                <div className="ep-video-wrapper-9-16">
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
                        Your browser does not support playing this video format.
                      </video>
                      <div className="ep-video-top-controls">
                        <button
                          type="button"
                          onClick={handleToggleFullscreen}
                          className="ep-video-fs-btn"
                          title="Fullscreen 9:16 Video"
                        >
                          <Maximize size={12} />
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
                            className="ep-video-sound-pill"
                          >
                            <VolumeX size={13} />
                            <span>Tap for Sound</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <iframe
                      ref={iframeRef}
                      src={embedVideoUrl}
                      title="Wedding Video"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>

                <div className="ep-video-status-footer">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className={`w-2 h-2 rounded-full transition-colors ${isVideoPlaying ? "bg-emerald-500 animate-pulse" : "bg-[#B47674]/60"}`} />
                    <span>{isVideoPlaying ? "Playing welcome video" : "Paused • Resumes as you scroll"}</span>
                  </span>
                  <span className="hidden sm:inline">Auto-scroll active</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          8. PHOTO GALLERY - ASYMMETRICAL MASONRY & LIGHTBOX
          ===================================================================== */}
      {galleryImages.length > 0 && (
        <section className="ep-section" id="gallery">
          <div className="ep-container-wide">
            <div className="text-center max-w-xl mx-auto mb-10">
              <p className="ep-section-kicker">Captured Moments</p>
              <h2 className="ep-section-title-serif">Photo <em>Gallery</em></h2>
              <p className="text-xs sm:text-sm text-[#5C524F] mt-2">
                Glimpses of shared laughter, quiet tenderness, and timeless memories
              </p>
              <div className="ep-divider-motif">
                <Flower2 size={16} />
              </div>
            </div>

            <div className="ep-gallery-grid">
              {galleryImages.map((imgUrl, i) => (
                <div
                  key={i}
                  className="ep-gallery-item"
                  onClick={() => setActivePhotoIndex(i)}
                  title="Click to expand"
                >
                  <img src={imgUrl} alt={`Captured Moment ${i + 1}`} className="ep-gallery-img" />
                  <div className="ep-gallery-hover-overlay">
                    <Sparkles size={24} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {activePhotoIndex !== null && (
        <div className="ep-lightbox-backdrop" onClick={() => setActivePhotoIndex(null)}>
          <div className="ep-lightbox-body" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ep-lightbox-close-btn"
              onClick={() => setActivePhotoIndex(null)}
              title="Close (Esc)"
            >
              <X size={26} />
            </button>

            <img
              src={galleryImages[activePhotoIndex]}
              alt={`Moment ${activePhotoIndex + 1}`}
              className="ep-lightbox-main-img"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="ep-lightbox-nav-btn ep-lightbox-prev"
                  onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                  title="Previous (Left Arrow)"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  className="ep-lightbox-nav-btn ep-lightbox-next"
                  onClick={() => setActivePhotoIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                  title="Next (Right Arrow)"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            <div className="ep-lightbox-counter">
              {activePhotoIndex + 1} / {galleryImages.length}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. FINAL SECTION ("FOREVER BEGINS HERE") & FOOTER
          ===================================================================== */}
      <footer className="ep-final-section">
        <div className="ep-container-narrow">
          <div className="ep-final-crest">
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="32" cy="32" r="28" stroke="#D9C3AB" strokeDasharray="3 3" />
              <path d="M32 14C32 14 36 24 44 28C52 32 58 32 58 32C58 32 50 36 44 40C38 44 32 50 32 50C32 50 26 44 20 40C14 36 6 32 6 32C6 32 12 32 20 28C28 24 32 14 32 14Z" fill="#F7ECE8" />
              <circle cx="32" cy="32" r="6" fill="#B47674" />
            </svg>
          </div>

          <p className="ep-section-kicker">With Love &amp; Gratitude</p>
          <h2 className="ep-final-title">Forever Begins <em>Here</em></h2>

          <p className="ep-final-message">
            We cannot wait to celebrate this magical milestone with the cherished family and friends who mean the entire world to us. Your presence will make our union truly complete.
          </p>

          <div className="font-serif text-2xl text-[#2B2523] tracking-wide mb-2">
            {brideName} &amp; {groomName}
          </div>
          <p className="text-xs uppercase tracking-widest text-[#B47674] font-medium">
            {formatDatePretty(weddingDateStr)}
          </p>

          <div className="ep-footer-bottom">
            <span>WebRyza Cards • Modern Luxury Digital Invitations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
