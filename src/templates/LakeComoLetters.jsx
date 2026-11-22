import React, { useState, useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Volume2,
  VolumeX,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Maximize,
  Check,
  Play,
  Pause
} from "lucide-react";
import "./LakeComoLetters.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * LAKE COMO LETTERS - European Editorial Destination Wedding Invitation Template
 * Inspired by Wedence's Italian Lake Como Letters stationery design.
 *
 * Distinctive Aesthetics:
 * - Italian handmade cotton paper (#f9f7f2)
 * - Deep cypress & olive green typography (#283223, #3f5138)
 * - Muted sage (#75806b) & antique champagne gold (#c5a46d)
 * - Fine-art editorial serif typography & delicate italics
 * - Story chapters, villa-style celebrations, and bespoke destination maps
 *
 * @param {Object} props
 * @param {Object} props.data - Dynamic wedding data payload conforming to schema
 */
export default function LakeComoLetters({ data = {} }) {
  // Safe field extractions
  const brideName = (data.brideName || "Ananya").trim();
  const groomName = (data.groomName || "Kabir").trim();
  const weddingDateStr = data.weddingDate || "2027-09-12";
  const weddingDatePretty = data.weddingDatePretty || data.weddingDateFormatted || weddingDateStr;
  const weddingTimeStr = data.weddingTime || "04:30 PM";
  const venueName = (data.venueName || "").trim();
  const venueAddress = (data.venueAddress || "").trim();
  const googleMapsLink = data.googleMapsLink || (venueName ? `https://maps.google.com/?q=${encodeURIComponent(`${venueName} ${venueAddress}`.trim())}` : "");
  const hashtag = (data.hashtag || `#${brideName}And${groomName}`).replace(/\s+/g, "");

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

  // Photographs & Descriptions
  const venueImage = data.venueImage || "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=85";
  const invitationNote = (data.invitationNote || data.additionalDetails || "").trim();

  // Story Chapters (Only render if provided by customer; do not invent fake chapters)
  const storyChapters = Array.isArray(data.story) ? data.story : [];

  // Events (Dynamic customer events or fallback to primary ceremony)
  const events = Array.isArray(data.events) && data.events.length > 0
    ? data.events
    : (venueName || weddingDateStr)
      ? [
          {
            name: "The Wedding Ceremony & Reception",
            date: weddingDateStr,
            time: weddingTimeStr,
            venue: venueName,
            address: venueAddress,
            mapLink: googleMapsLink,
            dressCode: "Formal or Festive Elegant",
            description: invitationNote || "Exchange of vows followed by a joyous banquet celebration with family and friends."
          }
        ]
      : [];

  // Gallery
  const galleryImages = Array.isArray(data.galleryImages) && data.galleryImages.length > 0
    ? data.galleryImages
    : [
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85"
      ];

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

  // Date Pretty Format
  const formatDatePretty = (dateStr) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Ambient Audio Controls
  const handleToggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => {
          setIsMusicPlaying(false);
        });
    }
  };

  // Video embed normalization
  const normalizedVideoUrl = useMemo(() => {
    if (!videoUrl) return "";
    const isDirect = /\.(mp4|webm|ogg|mov)($|\?)/i.test(videoUrl);
    if (isDirect) return videoUrl;

    const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      const vid = ytMatch[1];
      return `https://www.youtube.com/embed/${vid}?enablejsapi=1&autoplay=${hasVideoLoaded ? 1 : 0}&mute=0&playsinline=1&rel=0&controls=1`;
    }

    const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${hasVideoLoaded ? 1 : 0}&muted=0&playsinline=1`;
    }
    return videoUrl;
  }, [videoUrl, hasVideoLoaded]);

  const controlPlayback = (shouldPlay) => {
    setIsVideoPlaying(shouldPlay);

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
        // Safe cross-origin
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

  // GSAP ScrollTrigger Card Floating Animations
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. Hero Date Plaque Card
      gsap.fromTo(
        ".lcl-date-plaque",
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          delay: 0.15
        }
      );

      // 2. The Main Invitation Letter Card (3D stationery float)
      gsap.fromTo(
        ".lcl-letter-card",
        { y: 80, opacity: 0, scale: 0.94, rotateX: 6 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          duration: 1.25,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".lcl-letter-card",
            start: "top 88%",
            toggleActions: "play none none none"
          }
        }
      );

      // 3. Story Chapter Cards (Staggered floating entrance)
      const storyCards = gsap.utils.toArray(".lcl-story-chapter-card");
      if (storyCards.length) {
        gsap.fromTo(
          storyCards,
          { y: 65, opacity: 0, scale: 0.94 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".lcl-story-chapters-grid",
              start: "top 84%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // 4. Celebration Villa Cards (Floating arrival on scroll)
      const eventCards = gsap.utils.toArray(".lcl-event-villa-card");
      if (eventCards.length) {
        eventCards.forEach((card) => {
          gsap.fromTo(
            card,
            { y: 70, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 1.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 86%",
                toggleActions: "play none none none"
              }
            }
          );
        });
      }

      // 5. Video Player Canvas Card
      if (document.querySelector(".lcl-video-canvas-wrapper")) {
        gsap.fromTo(
          ".lcl-video-canvas-wrapper",
          { y: 75, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".lcl-video-canvas-wrapper",
              start: "top 82%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // 6. Photo Gallery Cards (Staggered entrance)
      const galleryCards = gsap.utils.toArray(".lcl-gallery-card");
      if (galleryCards.length) {
        gsap.fromTo(
          galleryCards,
          { y: 55, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.85,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".lcl-gallery-masonry-grid",
              start: "top 84%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // 7. Venue Destination Editorial Card
      if (document.querySelector(".lcl-venue-editorial-card")) {
        gsap.fromTo(
          ".lcl-venue-editorial-card",
          { y: 70, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".lcl-venue-editorial-card",
              start: "top 82%",
              toggleActions: "play none none none"
            }
          }
        );
      }
    });

    return () => mm.revert();
  }, [events, storyChapters, galleryImages]);

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
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    const container = videoSectionRef.current?.querySelector(".lcl-video-container-portrait");
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const handleToggleMute = () => {
    if (videoElementRef.current) {
      const nextMuted = !videoElementRef.current.muted;
      videoElementRef.current.muted = nextMuted;
      setIsVideoMuted(nextMuted);
    }
  };

  const handleTogglePlayPause = () => {
    controlPlayback(!isVideoPlaying);
  };

  // Keyboard navigation for Lightbox
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

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const isDirectVideo = Boolean(videoUrl && /\.(mp4|webm|ogg|mov)($|\?)/i.test(videoUrl));

  return (
    <div className="lcl-page-wrapper">
      {/* Hidden audio element for ambient soundtrack */}
      <audio ref={audioRef} loop src="/templates/temple-heritage/tabala_flute.mp3" preload="none" />

      {/* Floating Controls: Italian Acoustic Melody & Share */}
      <aside className="lcl-floating-controls" aria-label="Celebration Controls">
        <button
          type="button"
          onClick={handleToggleMusic}
          className="lcl-pill-btn"
          title="Toggle Italian Melody"
        >
          {isMusicPlaying ? (
            <>
              <div className="lcl-sound-wave-bars">
                <span /><span /><span />
              </div>
              <span>Melody Playing</span>
            </>
          ) : (
            <>
              <VolumeX size={14} className="text-[#3f5138]" />
              <span>Play Melody</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="lcl-pill-btn"
          title="Share Invitation"
        >
          {copiedLink ? (
            <>
              <Check size={14} className="text-emerald-700" />
              <span>Link Copied</span>
            </>
          ) : (
            <>
              <Share2 size={13} className="text-[#3f5138]" />
              <span>Share Letters</span>
            </>
          )}
        </button>
      </aside>

      {/* =====================================================================
          1. HERO - THE OPENING LETTERS
          (NO background video as requested; exquisite Italian editorial paper)
          ===================================================================== */}
      <header className="lcl-hero-section">
        <div className="lcl-hero-inner">
          {/* Italian Monogram / Laurel Ribbon */}
          <div className="lcl-hero-crest-monogram lcl-reveal lcl-reveal-up">
            <div className="lcl-laurel-badge">
              <span className="lcl-laurel-initials">
                {brideName.charAt(0)}<em className="lcl-laurel-amp">&amp;</em>{groomName.charAt(0)}
              </span>
            </div>
            <p className="lcl-hero-eyebrow">A WEDDING BY THE LAKE</p>
          </div>

          {/* Couple Editorial Title */}
          <h1 className="lcl-hero-title">
            <span className="lcl-hero-bride">{brideName}</span>
            <em className="lcl-hero-amp">&amp;</em>
            <span className="lcl-hero-groom">{groomName}</span>
          </h1>

          <div className="lcl-hero-separator lcl-reveal lcl-reveal-scale lcl-delay-2">
            <span className="lcl-sep-line" />
            <span className="lcl-sep-diamond">◇</span>
            <span className="lcl-sep-line" />
          </div>

          {/* The Date Is Written Plaque */}
          <div className="lcl-date-plaque lcl-reveal lcl-reveal-up lcl-delay-3">
            <span className="lcl-date-subtitle">The Date Is Written</span>
            <p className="lcl-date-highlight">{formatDatePretty(weddingDateStr)}</p>
            {weddingTimeStr && <p className="lcl-time-highlight">{weddingTimeStr}</p>}
            <p className="lcl-venue-highlight">{venueName} • Bellagio, Lake Como</p>
          </div>

          {/* Animated Minimal Scroll Indicator */}
          <a href="#letter" className="lcl-scroll-cue lcl-reveal lcl-reveal-up lcl-delay-4">
            <span>Scroll to read the letters</span>
            <div className="lcl-scroll-pill">
              <div className="lcl-scroll-dot" />
            </div>
          </a>
        </div>
      </header>

      {/* =====================================================================
          2. THE INVITATION LETTER ("Two families on one lake...")
          ===================================================================== */}
      <section id="letter" className="lcl-section lcl-invitation-section">
        <div className="lcl-container">
          <div className="lcl-letter-card lcl-reveal lcl-reveal-up">
            <div className="lcl-letter-stamp">
              <span className="lcl-stamp-em">{brideName.charAt(0)}{groomName.charAt(0)}</span>
              <span className="lcl-stamp-year">2027</span>
            </div>

            <p className="lcl-letter-prologue">
              Two families on one lake, and a weekend we will never forget.
            </p>

            <div className="lcl-letter-ornament">
              <span className="lcl-ornament-line" />
              <span className="lcl-ornament-motif">❧</span>
              <span className="lcl-ornament-line" />
            </div>

            <p className="lcl-letter-subheading">TOGETHER WITH OUR FAMILIES</p>
            <h2 className="lcl-letter-heading">We’re Getting Married</h2>

            <p className="lcl-letter-body">
              {invitationNote}
            </p>

            <div className="lcl-letter-signature-block">
              <div className="lcl-sig-couple">
                <span>{brideName}</span>
                <em>&amp;</em>
                <span>{groomName}</span>
              </div>
              
              {(brideParentsStr || groomParentsStr) && (
                <div className="lcl-sig-parents">
                  {brideParentsStr && <p>Daughter of {brideParentsStr}</p>}
                  {groomParentsStr && <p>Son of {groomParentsStr}</p>}
                </div>
              )}
            </div>

            <div className="lcl-letter-meta-strip">
              <div className="lcl-meta-item">
                <Calendar size={15} className="text-[#3f5138]" />
                <span>{formatDatePretty(weddingDateStr)}</span>
              </div>
              {weddingTimeStr && (
                <div className="lcl-meta-item">
                  <Clock size={15} className="text-[#3f5138]" />
                  <span>{weddingTimeStr}</span>
                </div>
              )}
              <div className="lcl-meta-item">
                <MapPin size={15} className="text-[#3f5138]" />
                <span>{venueName}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. THEIR STORY ("A collection of beautiful almosts becoming forever")
          ===================================================================== */}
      {storyChapters.length > 0 && (
        <section className="lcl-section lcl-story-section">
          <div className="lcl-container">
            <div className="lcl-section-header">
              <p className="lcl-section-tag">THEIR STORY</p>
              <h2 className="lcl-section-title">A collection of beautiful almosts becoming forever</h2>
            </div>

            <div className="lcl-story-chapters-grid">
              {storyChapters.map((ch, idx) => (
                <div key={idx} className={`lcl-story-chapter-card lcl-reveal lcl-reveal-up lcl-delay-${(idx % 4) + 1}`}>
                  <div className="lcl-chapter-header">
                    <span className="lcl-chapter-num">{ch.chapter || `0${idx + 1}`}</span>
                    <span className="lcl-chapter-year">{ch.year || "2027"}</span>
                  </div>
                  <h3 className="lcl-chapter-title">{ch.title}</h3>
                  <p className="lcl-chapter-desc">{ch.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          4. THE CELEBRATIONS ("A wedding told in ceremonies, colour, music...")
          ===================================================================== */}
      {events.length > 0 && (
        <section className="lcl-section lcl-events-section">
          <div className="lcl-container">
            <div className="lcl-section-header">
              <p className="lcl-section-tag">THE CELEBRATIONS</p>
              <h2 className="lcl-section-title">A wedding told in ceremonies, colour, music and light</h2>
              <p className="lcl-section-intro">Three unforgettable days along the lakeside.</p>
            </div>

            <div className="lcl-events-cards-wrapper">
              {events.map((evt, idx) => (
                <div key={idx} className={`lcl-event-villa-card lcl-reveal lcl-reveal-up lcl-delay-${(idx % 3) + 1}`}>
                  <div className="lcl-event-meta-top">
                    <span className="lcl-event-act">ACT 0{idx + 1} / 0{events.length}</span>
                    {evt.dressCode && (
                      <span className="lcl-event-dress-pill">{evt.dressCode}</span>
                    )}
                  </div>

                  <h3 className="lcl-event-title">{evt.name || "Celebration"}</h3>

                  <div className="lcl-event-schedule-strip">
                    <span className="lcl-schedule-item">
                      <Calendar size={14} className="text-[#3f5138]" />
                      <span>{formatDatePretty(evt.date)}</span>
                    </span>
                    {evt.time && (
                      <span className="lcl-schedule-item">
                        <Clock size={14} className="text-[#3f5138]" />
                        <span>{evt.time}</span>
                      </span>
                    )}
                  </div>

                  {(evt.venue || evt.address) && (
                    <div className="lcl-event-venue-block">
                      <MapPin size={15} className="text-[#3f5138] flex-shrink-0 mt-0.5" />
                      <span>{evt.venue ? `${evt.venue}, ` : ""}{evt.address || ""}</span>
                    </div>
                  )}

                  {evt.description && (
                    <p className="lcl-event-description">{evt.description}</p>
                  )}

                  {(evt.mapLink || googleMapsLink) && (
                    <a
                      href={evt.mapLink || googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lcl-event-map-btn"
                    >
                      <span>Navigate To Venue</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          5. WEDDING VIDEO - EDITORIAL FILM SECTION
          (Only rendered if videoUrl exists and is non-empty)
          ===================================================================== */}
      {videoUrl && (
        <section ref={videoSectionRef} className="lcl-section lcl-video-section">
          <div className="lcl-container">
            <div className="lcl-section-header lcl-reveal lcl-reveal-up">
              <p className="lcl-section-tag">CINEMATIC PREVIEW</p>
              <h2 className="lcl-section-title">Welcome to Our Wedding Film</h2>
            </div>

            <div className="lcl-video-canvas-wrapper lcl-reveal lcl-reveal-scale">
              <div className="lcl-video-container-portrait">
                {isDirectVideo ? (
                  <video
                    ref={videoElementRef}
                    src={normalizedVideoUrl}
                    className="lcl-video-player-element"
                    playsInline
                    muted={isVideoMuted}
                    loop
                    controls
                  />
                ) : (
                  <iframe
                    ref={iframeRef}
                    src={normalizedVideoUrl}
                    title="Lake Como Wedding Film"
                    className="lcl-video-iframe-element"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}

                {/* Video HUD status bar */}
                <div className="lcl-video-hud-bar">
                  <div className="lcl-video-status-indicator">
                    <span className="lcl-video-status-dot" />
                    <span>{isVideoPlaying ? "Playing wedding film" : "Automatic scroll playback ready"}</span>
                  </div>

                  <div className="lcl-video-actions">
                    {isDirectVideo && (
                      <>
                        <button
                          type="button"
                          onClick={handleTogglePlayPause}
                          className="lcl-video-action-btn"
                          title={isVideoPlaying ? "Pause Video" : "Play Video"}
                        >
                          {isVideoPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleMute}
                          className="lcl-video-action-btn"
                          title={isVideoMuted ? "Unmute Audio" : "Mute Audio"}
                        >
                          {isVideoMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleFullscreen}
                      className="lcl-video-action-btn"
                      title="Fullscreen 9:16 Video"
                    >
                      <Maximize size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          6. PHOTO GALLERY ("A Few Favourite Frames")
          ===================================================================== */}
      {galleryImages.length > 0 && (
        <section className="lcl-section lcl-gallery-section">
          <div className="lcl-container">
            <div className="lcl-section-header lcl-reveal lcl-reveal-up">
              <p className="lcl-section-tag">A FEW FAVOURITE FRAMES</p>
              <h2 className="lcl-section-title">Gallery</h2>
              <p className="lcl-section-intro">The photographs and quiet moments that brought us here.</p>
            </div>

            <div
              className={
                galleryImages.length === 1
                  ? "max-w-md mx-auto"
                  : galleryImages.length === 2
                  ? "grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-6"
                  : galleryImages.length === 3
                  ? "grid grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto gap-6"
                  : galleryImages.length === 4
                  ? "grid grid-cols-2 sm:grid-cols-4 max-w-5xl mx-auto gap-4 sm:gap-6"
                  : "lcl-gallery-masonry-grid"
              }
            >
              {galleryImages.map((imgSrc, idx) => {
                const isFeatured = galleryImages.length >= 5 && (idx === 0 || idx === 3);
                return (
                  <div
                    key={idx}
                    className={`lcl-gallery-card ${isFeatured ? "lcl-gallery-card-featured" : ""} ${
                      galleryImages.length === 1 ? "aspect-[4/5] sm:aspect-square" : ""
                    } lcl-reveal lcl-reveal-up lcl-delay-${(idx % 4) + 1}`}
                    onClick={() => setActivePhotoIndex(idx)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open photograph ${idx + 1}`}
                  >
                    <img
                      src={imgSrc}
                      alt={`Gallery moment ${idx + 1}`}
                      className="lcl-gallery-img"
                      loading="lazy"
                    />
                    <div className="lcl-gallery-overlay">
                      <span className="lcl-zoom-pill">View</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {activePhotoIndex !== null && (
        <div
          className="lcl-lightbox-backdrop"
          onClick={() => setActivePhotoIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lcl-lightbox-body" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lcl-lightbox-close-btn"
              onClick={() => setActivePhotoIndex(null)}
              aria-label="Close Lightbox"
            >
              <X size={24} />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="lcl-lightbox-nav-btn lcl-lightbox-prev"
                  onClick={() =>
                    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
                  }
                  aria-label="Previous photograph"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  type="button"
                  className="lcl-lightbox-nav-btn lcl-lightbox-next"
                  onClick={() =>
                    setActivePhotoIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))
                  }
                  aria-label="Next photograph"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <img
              src={galleryImages[activePhotoIndex]}
              alt={`Expanded wedding photograph ${activePhotoIndex + 1}`}
              className="lcl-lightbox-main-img"
            />

            <div className="lcl-lightbox-counter">
              <span>{String(activePhotoIndex + 1).padStart(2, "0")}</span>
              <span className="lcl-lightbox-sep">/</span>
              <span>{String(galleryImages.length).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. THE DESTINATION ("Villa Aurelia")
          ===================================================================== */}
      {venueName && (
        <section className="lcl-section lcl-venue-section">
          <div className="lcl-container">
            <div className="lcl-venue-editorial-card lcl-reveal lcl-reveal-up">
              <div className="lcl-venue-media-half">
                <img src={venueImage} alt={venueName} className="lcl-venue-img" />
              </div>
              
              <div className="lcl-venue-content-half">
                <p className="lcl-venue-tag">THE DESTINATION</p>
                <h2 className="lcl-venue-name">{venueName}</h2>
                <p className="lcl-venue-desc">
                  {data.additionalDetails || (venueAddress ? `Celebration venue at ${venueAddress}` : "We look forward to celebrating our special day with you.")}
                </p>
                
                {venueAddress && (
                  <p className="lcl-venue-location-row">
                    <MapPin size={16} className="text-[#3f5138] flex-shrink-0 mt-0.5" />
                    <span>{venueAddress}</span>
                  </p>
                )}

                {googleMapsLink && (
                  <div className="lcl-venue-btn-wrapper">
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lcl-venue-map-link"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          8. CLOSING SECTION ("Forever Begins Here")
          (NO RSVP as requested by user; clean European destination signature)
          ===================================================================== */}
      <footer className="lcl-final-section">
        <div className="lcl-container">
          <div className="lcl-final-inner">
            <div className="lcl-final-monogram">
              <span>{brideName.charAt(0)}</span>
              <em>&amp;</em>
              <span>{groomName.charAt(0)}</span>
            </div>

            <h2 className="lcl-final-couple-names">
              {brideName} <em>&amp;</em> {groomName}
            </h2>

            <p className="lcl-final-date">{formatDatePretty(weddingDateStr)}</p>

            {hashtag && <p className="lcl-final-hashtag">{hashtag}</p>}

            <p className="lcl-final-gratitude">
              Share your favourite moments and memories with us as we celebrate this new chapter together.
            </p>

            <div className="lcl-final-footer-bottom">
              <p>WEBRYZA CARDS STUDIO • DIGITAL WEDDING INVITATIONS</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
