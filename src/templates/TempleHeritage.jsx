import React, { useState, useEffect, useRef, useMemo } from "react";
import "./TempleHeritage.css";

/**
 * TEMPLE HERITAGE (Vishu & Kavya)
 * South Indian Temple Architecture Digital Wedding Invitation Template
 *
 * @param {Object} props
 * @param {Object} props.data - Dynamic wedding data payload
 */
export default function TempleHeritage({ data = {} }) {
  // Safe field extractions with fallbacks to the provided template defaults
  const groomName = (data.groomName || "Vishu").trim();
  const brideName = (data.brideName || "Kavya").trim();
  const weddingDateStr = data.weddingDate || "2026-11-02";
  const weddingTimeStr = data.weddingTime || "08:00 AM";
  const venueName = (data.venueName || "Rambagh, Jaipur").trim();
  const venueAddress = (data.venueAddress || "").trim();

  // Media assets
  const coupleImage = data.coupleImage || "/templates/temple-heritage/images/couple_portrait.jpg";
  const ganeshaImage = data.ganeshaImage || "/templates/temple-heritage/images/ganesha_motif.jpg";
  const templeBgImage = data.templeBgImage || "/templates/temple-heritage/images/temple_hero_bg.jpg";
  const videoUrl = data.videoUrl || "/templates/temple-heritage/marriage_video.mp4";
  const audioUrl = data.audioUrl || "/templates/temple-heritage/tabala_flute.mp3";

  // Parents and family formatting
  const grandparents = Array.isArray(data.grandparents) && data.grandparents.length > 0
    ? data.grandparents
    : [
      "Smt. Parvathi Ammal & Shri Krishnan Iyer",
      "Smt. Kamakshi Ammal & Shri Srinivasan Iyer"
    ];

  const formatParentText = (parentObj, defaultText) => {
    if (!parentObj) return defaultText;
    if (typeof parentObj === "string") return parentObj.trim();
    if (typeof parentObj === "object") {
      const parts = [];
      if (parentObj.mother) parts.push(parentObj.mother.trim());
      if (parentObj.father) parts.push(parentObj.father.trim());
      return parts.length > 0 ? parts.join(" & ") : defaultText;
    }
    return defaultText;
  };

  const brideParentsText = formatParentText(data.brideParents, "Smt. Parvathi & Shri K. Ramaswamy");
  const groomParentsText = formatParentText(data.groomParents, "Smt. Shanthi & Shri K. Venkatachalam");

  // Events list
  const defaultEvents = [
    {
      name: "Mehendi",
      icon: "🌸",
      date: "Friday, March 9th 2026",
      venue: "Rambagh, Jaipur",
      time: "6pm Onwards",
      mapLink: "https://maps.google.com/?q=Rambagh+Jaipur"
    },
    {
      name: "Haldi",
      icon: "💛",
      date: "Friday, March 10th 2026",
      venue: "Rambagh, Jaipur",
      time: "10am Onwards",
      mapLink: "https://maps.google.com/?q=Rambagh+Jaipur"
    },
    {
      name: "Sangeet",
      icon: "🎶",
      date: "Friday, March 10th 2026",
      venue: "Rambagh, Jaipur",
      time: "7pm Onwards",
      mapLink: "https://maps.google.com/?q=Rambagh+Jaipur"
    },
    {
      name: "Engagement",
      icon: "💍",
      date: "Friday, March 11th 2026",
      venue: "Rambagh, Jaipur",
      time: "11am Onwards",
      mapLink: "https://maps.google.com/?q=Rambagh+Jaipur"
    },
    {
      name: "Muhurtham",
      icon: "🪷",
      date: "Monday, November 2nd 2026",
      venue: "Rambagh, Jaipur",
      time: "8am Onwards",
      isHighlight: true,
      mapLink: "https://maps.google.com/?q=Rambagh+Jaipur"
    },
    {
      name: "Reception",
      icon: "🎊",
      date: "Friday, March 17th 2026",
      venue: "Rambagh, Jaipur",
      time: "7pm Onwards",
      mapLink: "https://maps.google.com/?q=Rambagh+Jaipur"
    }
  ];

  const events = Array.isArray(data.events) && data.events.length > 0
    ? data.events
    : defaultEvents;

  // --------------------------------------------------------------------------
  // 1. COUNTDOWN TIMER
  // --------------------------------------------------------------------------
  const targetDate = useMemo(() => {
    try {
      const [year, month, day] = weddingDateStr.split("-").map(Number);
      let hours = 8;
      let minutes = 0;
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
      return new Date("2026-11-02T08:00:00");
    }
  }, [weddingDateStr, weddingTimeStr]);

  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    isPast: false
  });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00", isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        isPast: false
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // --------------------------------------------------------------------------
  // 2. PARALLAX SCROLL EFFECT (Gopuram & Footer Temple)
  // --------------------------------------------------------------------------
  const gopuramRef = useRef(null);
  const footerPatternRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset;

          // Parallax on temple gopuram image
          if (gopuramRef.current) {
            const offset = scrollY * 0.15;
            gopuramRef.current.style.transform = `translateY(${offset.toFixed(2)}px)`;
          }

          // Parallax on Footer Temple Background
          if (footerPatternRef.current && footerRef.current) {
            const rect = footerRef.current.getBoundingClientRect();
            if (rect.top <= window.innerHeight && rect.bottom >= 0) {
              const footerScroll = -rect.top * 0.22;
              footerPatternRef.current.style.transform = `scale(1.08) translateY(${footerScroll.toFixed(2)}px)`;
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --------------------------------------------------------------------------
  // 3. BACKGROUND MUSIC (TABALA & FLUTE)
  // --------------------------------------------------------------------------
  const audioRef = useRef(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

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

  const toggleMusic = () => {
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

  // --------------------------------------------------------------------------
  // 4. INLINE WEDDING VIDEO: Auto-play on arrival & Pause/Resume on scroll
  // (In place of "Follow the action" & without the floating video button)
  // --------------------------------------------------------------------------
  const videoSectionRef = useRef(null);
  const videoElementRef = useRef(null);
  const iframeRef = useRef(null);
  const [hasVideoLoaded, setHasVideoLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        elem.requestFullscreen().catch(() => { });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Parse embeddable video URL (YouTube, Vimeo, direct mp4)
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
    return videoUrl; // Direct video path
  }, [videoUrl, hasVideoLoaded]);

  // Controller: Pause when moving away, resume where stopped when returning
  const controlPlayback = (shouldPlay) => {
    setIsVideoPlaying(shouldPlay);

    // 1. Direct HTML5 Video
    if (videoElementRef.current) {
      if (shouldPlay) {
        if (audioRef.current && isMusicPlaying) {
          audioRef.current.pause();
        }
        videoElementRef.current.muted = false;
        videoElementRef.current.play().catch(() => { });
      } else {
        videoElementRef.current.pause();
        if (audioRef.current && isMusicPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    }

    // 2. YouTube / Vimeo Iframe via postMessage API
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        if (shouldPlay) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: "" }),
            "*"
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: "play" }),
            "*"
          );
        } else {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
            "*"
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: "pause" }),
            "*"
          );
        }
      } catch (e) {
        // Safe cross-origin ignore
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
      {
        threshold: 0.35, // Trigger when 35% of the section is visible
      }
    );

    observer.observe(videoSectionRef.current);
    return () => observer.disconnect();
  }, [hasVideoLoaded]);

  // --------------------------------------------------------------------------
  // 5. 3D CARD TILT EFFECT
  // --------------------------------------------------------------------------
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    card.style.transform = `translateY(-6px) rotateX(${-y}deg) rotateY(${x}deg)`;
    card.style.perspective = "800px";
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = "";
  };

  return (
    <div className="th-wrapper">
      {/* Background Audio Element */}
      <audio ref={audioRef} loop preload="auto">
        <source src={audioUrl} type="audio/mpeg" />
      </audio>

      {/* Floating Background Music Toggle Button */}
      <button
        type="button"
        className={`music-toggle-btn ${!isMusicPlaying ? "paused" : ""}`}
        onClick={toggleMusic}
        aria-label="Toggle Background Music"
        title="Play/Pause Background Music"
      >
        <span className="music-waves">
          <span className="bar bar-1" />
          <span className="bar bar-2" />
          <span className="bar bar-3" />
        </span>
      </button>

      {/* ═══════════════════════════════════════════
           SECTION 1: HERO / COVER (MEENAYA ORIGINAL VIDEO DESIGN)
      ═══════════════════════════════════════════ */}
      <section className="hero-meenaya" id="hero">
        {/* Floating Sky Lanterns */}
        <div className="sky-lanterns-container">
          <div className="lantern lantern-1" />
          <div className="lantern lantern-2" />
          <div className="lantern lantern-3" />
          <div className="lantern lantern-4" />
          <div className="lantern lantern-5" />
          <div className="lantern lantern-6" />
          <div className="lantern lantern-7" />
        </div>

        {/* Sky & Temple Gopuram Header */}
        <div className="temple-hero-wrapper">
          <div className="temple-sky-header">
            <h1 className="meenaya-title-groom">{groomName}</h1>
            <div className="meenaya-weds-label">WEDS</div>
            <h1 className="meenaya-title-bride">{brideName}</h1>
          </div>
          <div className="temple-image-box">
            <img
              ref={gopuramRef}
              src={templeBgImage}
              alt="South Indian Temple Gopuram"
              className="temple-gopuram-img"
            />
          </div>
        </div>

        {/* Red Terrace Wall Transition Divider */}
        <div className="terrace-divider" />

        {/* Emerald Green Damask Invite Card Section */}
        <div className="emerald-card-section">
          <div className="damask-overlay" />
          <div className="emerald-card-content">
            <div className="mantra-badge-emerald">
              <span className="mantra-text">ॐ श्री गणेशाय नम</span>
            </div>
            <div className="ganesha-container-emerald">
              <img src={ganeshaImage} alt="Lord Ganesha" />
            </div>
            <div className="blessings-text-emerald">
              <p className="blessings-label-emerald">With the heavenly blessings of</p>
              {grandparents.map((name, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="divider-line-emerald">——</div>}
                  <p className="family-names-emerald">{name}</p>
                </React.Fragment>
              ))}
            </div>
            <div className="invite-text-emerald">
              <p className="invite-label-emerald">INVITE</p>
              <p className="invite-sub-emerald">You to join us in the wedding celebrations of</p>
            </div>
            <div className="couple-names-emerald">
              <h3 className="name-emerald">{groomName}</h3>
              <span className="amp-emerald">&amp;</span>
              <h3 className="name-emerald">{brideName}</h3>
            </div>
            <div className="daughter-of-emerald">
              <p>Daughter of</p>
              <p className="parents-name-emerald">{brideParentsText}</p>
            </div>
            <div className="scroll-indicator-emerald">
              <span>Scroll to explore</span>
              <div className="scroll-arrow">↓</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
           SECTION 2: CELEBRATIONS / EVENTS
      ═══════════════════════════════════════════ */}
      <section className="events-section" id="events">
        <div className="events-header">
          <p className="events-subtitle">On the following events</p>
          <h2 className="section-title-serif">Celebrations</h2>
        </div>
        <div className="events-grid">
          {events.map((ev, i) => {
            const isHighlight = ev.isHighlight || ev.name?.toLowerCase().includes("muhurtham") || ev.name?.toLowerCase().includes("wedding");
            const mapLink = ev.mapLink || ev.locationLink || (ev.venue ? `https://maps.google.com/?q=${encodeURIComponent(ev.venue)}` : "https://maps.google.com");
            return (
              <div
                key={i}
                className={`event-card ${isHighlight ? "highlight-card" : ""}`}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="event-icon">{ev.icon || (i % 2 === 0 ? "🌸" : "🪷")}</div>
                <h3 className="event-name">{ev.name || `Ceremony ${i + 1}`}</h3>
                <div className="event-details">
                  {ev.date && <p className="event-date">{ev.date}</p>}
                  {ev.venue && <p className="event-venue">{ev.venue}</p>}
                  {ev.time && <p className="event-time">{ev.time}</p>}
                </div>
                <a href={mapLink} target="_blank" rel="noopener noreferrer" className="route-link">
                  See the route →
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
           SECTION 3: MEET THE COUPLE
      ═══════════════════════════════════════════ */}
      <section className="couple-section" id="couple">
        <div className="couple-container">
          <div className="couple-text-side">
            <p className="section-label-small">meet the</p>
            <h2 className="couple-heading">bride and groom</h2>
            <div className="ornament-divider">❧</div>
            <p className="couple-message">
              We are both so delighted that you are able to join us in celebrating what we hope will be one of the happiest days of our lives. The affection shown to us by so many people since our Nichayathartham has been incredibly moving, and has touched us both deeply. We would like to take this opportunity to thank everyone most sincerely for their kindness.
            </p>
            <p className="couple-message">We are looking forward to see you at the wedding.</p>
            <div className="couple-names-small">
              <span className="name-tag">{groomName}</span>
              <span className="name-amp">&amp;</span>
              <span className="name-tag">{brideName}</span>
            </div>
          </div>
          <div className="couple-image-side">
            <div className="couple-img-frame">
              <img src={coupleImage} alt={`${groomName} and ${brideName}`} className="couple-photo" />
              <div className="img-overlay-text">
                <span className="overlay-name">{groomName} &amp; {brideName}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
           SECTION 4: INLINE WEDDING VIDEO
           (Replaces "Follow the action" & Floating Video Button)
           Auto-plays when entering view, pauses on scroll away, resumes where stopped!
      ═══════════════════════════════════════════ */}
      {Boolean(videoUrl && embedVideoUrl) && (
        <section ref={videoSectionRef} className="th-video-section" id="wedding-video">
          <div className="th-video-header">
            <p className="th-video-subtitle">A Special Welcome Message</p>
            <h2 className="th-video-title">Welcome to our <em>wedding</em></h2>
          </div>

          <div className="th-video-container">
            <div className="th-video-wrapper">
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
                  <div className="th-video-top-controls">
                    <button
                      type="button"
                      className="th-video-fs-btn"
                      onClick={handleToggleFullscreen}
                      title="Fullscreen 9:16 Video"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                      <span>Fullscreen</span>
                    </button>
                    {isVideoMuted && (
                      <button
                        type="button"
                        className="th-video-sound-pill"
                        onClick={() => {
                          setIsVideoMuted(false);
                          if (videoElementRef.current) {
                            videoElementRef.current.muted = false;
                          }
                        }}
                      >
                        <span>🔊 Tap for Sound</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={embedVideoUrl}
                  title="Wedding Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            {/* Smart Scroll Playback Status Bar */}
            <div className="th-video-status-indicator">
              <span>
                <span className={`th-video-dot ${isVideoPlaying ? "active" : "paused"}`} />
                {isVideoPlaying ? "Playing welcome video" : "Paused • Resumes as you scroll"}
              </span>
              <span>Automatic scroll playback active</span>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
           SECTION 5: COUNTDOWN
      ═══════════════════════════════════════════ */}
      <section className="countdown-section" id="countdown">
        <div className="countdown-bg-decoration" />
        <div className="countdown-content">
          <p className="countdown-label">The countdown begins</p>
          <div className="countdown-timer" id="timer">
            <div className="time-block">
              <span className="time-num" id="days">{timeLeft.days}</span>
              <span className="time-unit">Days</span>
            </div>
            <span className="time-sep">:</span>
            <div className="time-block">
              <span className="time-num" id="hours">{timeLeft.hours}</span>
              <span className="time-unit">Hours</span>
            </div>
            <span className="time-sep">:</span>
            <div className="time-block">
              <span className="time-num" id="minutes">{timeLeft.minutes}</span>
              <span className="time-unit">Mins</span>
            </div>
            <span className="time-sep">:</span>
            <div className="time-block">
              <span className="time-num" id="seconds">{timeLeft.seconds}</span>
              <span className="time-unit">Secs</span>
            </div>
          </div>
          <p className="countdown-message">
            Our families are excited that you are able to join us in celebrating what we hope will be one of the happiest days of our lives.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
           FOOTER (FULL-PAGE TEMPLE BACKGROUND WITH PARALLAX)
           (Note: The contact form has been removed as requested)
      ═══════════════════════════════════════════ */}
      <footer ref={footerRef} className="footer" id="footer">
        <div ref={footerPatternRef} className="footer-pattern" />
        <div className="footer-content">
          <div className="mantra-badge-emerald footer-mantra">
            <span className="mantra-text">ॐ श्री गणेशाय नम</span>
          </div>
          <div className="footer-names">
            <span className="footer-bride">{groomName}</span>
            <span className="footer-amp">&amp;</span>
            <span className="footer-groom">{brideName}</span>
          </div>
          <p className="footer-date">
            {weddingDateStr} · {venueName}
          </p>
          <div className="footer-divider" />
          <p className="footer-thankyou">We look forward to celebrating with you!</p>
          <p className="footer-copy">© webryza 2026</p>
        </div>
      </footer>
    </div>
  );
}
