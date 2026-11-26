/**
 * Centralized Data Mapping Layer
 * 
 * Maps raw Firestore wedding records (from `wedding_cards` or `public_invitations`)
 * into a standardized, complete, and sanitized payload consumed by all 4 wedding templates:
 * 1. Royal Gold (royal-gold)
 * 2. Temple Heritage (temple-heritage)
 * 3. Elegant Pastel Romance (elegant-pastel-romance)
 * 4. Lake Como Letters (lakecomo-letters)
 * 
 * Security Guarantee:
 * Strips sensitive customer contact details (phone, email), pricing, commissions,
 * admin notes, and internal partner identifiers.
 */

/**
 * Robustly normalizes various date representations into YYYY-MM-DD
 * Supports:
 * - Firestore Timestamp instance (.toDate())
 * - Serialized Timestamp object ({ seconds, nanoseconds })
 * - ISO string or date strings
 * - Date object
 */
export function normalizeDate(dateVal) {
  if (!dateVal) return "";

  try {
    // 1. Date object
    if (dateVal instanceof Date) {
      if (isNaN(dateVal.getTime())) return "";
      return dateVal.toISOString().split("T")[0];
    }

    // 2. Firestore Timestamp instance
    if (typeof dateVal.toDate === "function") {
      const d = dateVal.toDate();
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }

    // 3. Serialized Firestore Timestamp object { seconds, nanoseconds }
    if (typeof dateVal === "object" && typeof dateVal.seconds === "number") {
      const d = new Date(dateVal.seconds * 1000);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }

    // 4. String format
    if (typeof dateVal === "string") {
      const trimmed = dateVal.trim();
      // Already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      // Parseable date string
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
      return trimmed;
    }
  } catch {
    return "";
  }

  return "";
}

/**
 * Format date string into human-readable Indian format
 * e.g. "Monday, November 30, 2026"
 */
export function formatDatePretty(dateVal) {
  if (!dateVal) return "";
  try {
    const isoDate = normalizeDate(dateVal);
    if (!isoDate) return typeof dateVal === "string" ? dateVal : "";

    const [year, month, day] = isoDate.split("-").map(Number);
    const d = new Date(year, month - 1, day, 12, 0, 0);
    if (isNaN(d.getTime())) return isoDate;

    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return typeof dateVal === "string" ? dateVal : "";
  }
}

/**
 * Normalizes parent inputs (supports strings, { mother, father } objects, or arrays)
 */
export function normalizeParents(parents) {
  if (!parents) {
    return { text: "", mother: "", father: "" };
  }

  if (typeof parents === "string") {
    const trimmed = parents.trim();
    return { text: trimmed, mother: "", father: "" };
  }

  if (typeof parents === "object" && !Array.isArray(parents)) {
    const mother = (parents.mother || "").trim();
    const father = (parents.father || "").trim();
    const parts = [father, mother].filter(Boolean);
    const text = parts.length > 0 ? parts.join(" & ") : (parents.text || "").trim();
    return { text, mother, father };
  }

  return { text: "", mother: "", father: "" };
}

/**
 * Assigns culturally appropriate iconography to event titles
 */
export function determineEventIcon(name = "", index = 0) {
  const lower = name.toLowerCase();
  if (lower.includes("haldi") || lower.includes("pellikuthuru") || lower.includes("mangalasnanam")) return "💛";
  if (lower.includes("mehendi") || lower.includes("henna")) return "🌸";
  if (lower.includes("sangeet") || lower.includes("musical") || lower.includes("dj") || lower.includes("cocktail")) return "🎶";
  if (lower.includes("engagement") || lower.includes("ring") || lower.includes("roka") || lower.includes("nischithartham")) return "💍";
  if (lower.includes("muhurtham") || lower.includes("wedding") || lower.includes("kalyanam") || lower.includes("shaadi") || lower.includes("pheras")) return "🪷";
  if (lower.includes("reception") || lower.includes("dinner") || lower.includes("party")) return "🎊";
  if (lower.includes("vratham") || lower.includes("pooja") || lower.includes("puja") || lower.includes("havan")) return "🪔";
  if (lower.includes("welcome") || lower.includes("brunch")) return "🥂";

  const defaultIcons = ["🪷", "🌸", "✨", "💫", "🌿"];
  return defaultIcons[index % defaultIcons.length];
}

/**
 * Normalizes template ID to match one of the 4 supported templates
 */
export function normalizeTemplateId(templateId = "") {
  const raw = String(templateId || "royal-gold").toLowerCase().trim();
  if (raw.includes("temple") || raw.includes("vishu") || raw.includes("heritage")) {
    return "temple-heritage";
  }
  if (raw.includes("floral") || raw.includes("botanical") || raw.includes("bloom") || raw.includes("lake") || raw.includes("letters") || raw.includes("como")) {
    return "lakecomo-letters";
  }
  if (raw.includes("pastel") || raw.includes("watercolor") || raw.includes("romance")) {
    return "elegant-pastel-romance";
  }
  return "royal-gold";
}

/**
 * Main Centralized Mapper
 * 
 * Takes raw Firestore document data and returns a fully mapped, safe, and template-ready object.
 */
export function mapFirestoreToTemplateData(docData = {}, weddingIdentifier = "") {
  const safeId = docData.weddingId || weddingIdentifier || "WR-0000";
  const templateId = normalizeTemplateId(docData.templateId);

  // Couple
  const brideName = (docData.brideName || "").trim();
  const groomName = (docData.groomName || "").trim();

  // Parents
  const brideParentsObj = normalizeParents(docData.brideParents);
  const groomParentsObj = normalizeParents(docData.groomParents);

  // Wedding Date & Time
  const weddingDateStr = normalizeDate(docData.weddingDate);
  const weddingDatePretty = formatDatePretty(weddingDateStr);
  const weddingTimeStr = (docData.weddingTime || "").trim();

  // Venue & Location
  const venueName = (docData.venueName || "").trim();
  const venueAddress = (docData.venueAddress || "").trim();
  const rawVenueLocation = (docData.venueLocation || "").trim();

  const googleMapsLink = rawVenueLocation || (venueName
    ? `https://maps.google.com/?q=${encodeURIComponent(`${venueName} ${venueAddress}`.trim())}`
    : "");

  // Note / Message
  const invitationNote = (
    docData.additionalDetails ||
    docData.invitationNote ||
    docData.coupleMessage ||
    ""
  ).trim();

  // Events Mapping
  let mappedEvents = [];
  if (Array.isArray(docData.events) && docData.events.length > 0) {
    mappedEvents = docData.events.map((ev, idx) => {
      const evName = (ev.eventName || ev.name || `Ceremony ${idx + 1}`).trim();
      const evDate = normalizeDate(ev.date) || weddingDateStr;
      const evTime = (ev.time || weddingTimeStr).trim();
      const evVenue = (ev.venueName || ev.venue || venueName).trim();
      const evAddress = (ev.venueAddress || ev.address || venueAddress).trim();
      const evLink = (
        ev.locationLink ||
        ev.mapLink ||
        ev.googleMapsLink ||
        (evVenue ? `https://maps.google.com/?q=${encodeURIComponent(`${evVenue} ${evAddress}`.trim())}` : googleMapsLink)
      ).trim();

      const isHighlight =
        Boolean(ev.isHighlight) ||
        /muhurtham|wedding|kalyanam|shaadi|pheras|ceremony/i.test(evName);

      return {
        name: evName,
        eventName: evName,
        date: evDate,
        datePretty: formatDatePretty(evDate),
        time: evTime,
        venue: evVenue,
        venueName: evVenue,
        address: evAddress,
        venueAddress: evAddress,
        mapLink: evLink,
        locationLink: evLink,
        googleMapsLink: evLink,
        description: (ev.description || "").trim(),
        icon: ev.icon || determineEventIcon(evName, idx),
        isHighlight,
      };
    });
  } else if (venueName || weddingDateStr) {
    // If no individual sub-events were entered, synthesize a single ceremony event
    // so templates do NOT fall back to dummy placeholder events in Jaipur or Lake Como!
    mappedEvents = [
      {
        name: "Wedding Ceremony",
        eventName: "Wedding Ceremony",
        date: weddingDateStr,
        datePretty: weddingDatePretty,
        time: weddingTimeStr,
        venue: venueName,
        venueName: venueName,
        address: venueAddress,
        venueAddress: venueAddress,
        mapLink: googleMapsLink,
        locationLink: googleMapsLink,
        googleMapsLink: googleMapsLink,
        description: invitationNote || "Auspicious wedding ceremony celebration.",
        icon: "🪷",
        isHighlight: true,
      },
    ];
  }

  // Media extraction (supports both images object and flat fields)
  // Dynamic video state: distinguishes between no-video requested, video in preparation, and video uploaded
  const videoRequired = Boolean(docData.videoRequired ?? docData.aiVideoRequired);
  const videoStyle = docData.videoStyle || null;
  const aiVideoRequired = videoRequired;
  const rawVideoStatus = String(docData.videoStatus || docData.aiVideoStatus || "").toLowerCase().trim();
  const rawVideoUrl = String(docData.videoUrl || "").trim();
  const videoPublicId = String(docData.videoPublicId || "").trim();
  const videoUploadedAt = docData.videoUploadedAt || null;

  // Video section should appear if customer requested video or if admin assigned a video
  const hasVideoSection = Boolean(
    aiVideoRequired ||
    rawVideoStatus === "pending" ||
    rawVideoStatus === "uploaded" ||
    rawVideoUrl
  );

  // Video is active and ready to play if valid videoUrl exists and status is not pending/processing
  const isVideoUploaded = Boolean(
    rawVideoUrl &&
    rawVideoStatus !== "pending" &&
    rawVideoStatus !== "processing"
  );

  const videoStatus = isVideoUploaded
    ? "uploaded"
    : (hasVideoSection ? "pending" : "not_requested");

  const videoUrl = isVideoUploaded ? rawVideoUrl : "";
  const bridePhotoUrl = (docData.images?.bride || docData.bridePhotoUrl || "").trim();
  const groomPhotoUrl = (docData.images?.groom || docData.groomPhotoUrl || "").trim();
  const couplePhotoUrl = (docData.images?.couple || docData.couplePhotoUrl || "").trim();
  const rawGallery = Array.isArray(docData.images?.gallery) && docData.images.gallery.length > 0
    ? docData.images.gallery
    : (Array.isArray(docData.galleryImages) ? docData.galleryImages : []);

  // Template-specific image enforcement:
  // - Royal Gold: Gallery ONLY (1-6). No bride, groom, or couple hero photo.
  // - Temple Heritage: Couple photo ONLY (1 photo). No bride, groom, or gallery.
  // - Elegant Pastel Romance: Couple (hero), Bride, Groom, and Gallery (1-8).
  // - Lake Como Letters: Gallery ONLY (1-7). No bride, groom, or couple hero photo.
  let coupleImage = "";
  let brideImage = "";
  let groomImage = "";
  let galleryImages = [];

  if (templateId === "temple-heritage") {
    coupleImage = couplePhotoUrl || docData.coupleImage || docData.heroImage || "";
    galleryImages = [];
  } else if (templateId === "elegant-pastel-romance") {
    coupleImage = couplePhotoUrl || docData.coupleImage || docData.heroImage || "";
    brideImage = bridePhotoUrl || docData.brideImage || "";
    groomImage = groomPhotoUrl || docData.groomImage || "";
    galleryImages = rawGallery;
  } else if (templateId === "lakecomo-letters" || templateId === "royal-gold") {
    // Gallery-only templates
    galleryImages = rawGallery;
  } else {
    // Default fallback
    coupleImage = couplePhotoUrl || docData.coupleImage || docData.heroImage || "";
    brideImage = bridePhotoUrl || docData.brideImage || "";
    groomImage = groomPhotoUrl || docData.groomImage || "";
    galleryImages = rawGallery;
  }

  // Grandparents & Story (Only keep if explicitly provided; NEVER invent fake data)
  const grandparents = Array.isArray(docData.grandparents) && docData.grandparents.length > 0
    ? docData.grandparents
    : null;

  const story = Array.isArray(docData.story) && docData.story.length > 0
    ? docData.story
    : null;

  // Hashtag
  const hashtag = docData.hashtag || (
    brideName && groomName
      ? `#${brideName.replace(/\s+/g, "")}And${groomName.replace(/\s+/g, "")}`
      : ""
  );

  // Return unified schema with all aliases expected across the 4 templates
  return {
    // Identifiers
    id: safeId,
    weddingId: safeId,
    templateId: templateId,
    source: docData.source || "direct",

    // Couple Details
    brideName,
    groomName,
    coupleNames: brideName && groomName ? `${brideName} & ${groomName}` : brideName || groomName,
    brideDescription: docData.brideDescription || docData.brideBio || "",
    groomDescription: docData.groomDescription || docData.groomBio || "",

    // Parents
    brideParents: brideParentsObj.text,
    groomParents: groomParentsObj.text,
    brideParentsText: brideParentsObj.text,
    groomParentsText: groomParentsObj.text,
    brideParentsObj,
    groomParentsObj,

    // Wedding Timing & Location
    weddingDate: weddingDateStr,
    weddingDateStr: weddingDateStr,
    weddingDatePretty,
    weddingDateFormatted: weddingDatePretty,
    weddingTime: weddingTimeStr,
    weddingTimeStr: weddingTimeStr,
    venueName,
    venueAddress,
    venueLocation: rawVenueLocation,
    googleMapsLink,

    // Events
    events: mappedEvents,

    // Content & Notes
    invitationNote,
    additionalDetails: invitationNote,
    coupleMessage: invitationNote,
    hashtag,

    // Media
    videoUrl,
    rawVideoUrl,
    videoPublicId,
    videoStatus,
    videoUploadedAt,
    hasVideoSection,
    isVideoUploaded,
    coupleImage,
    brideImage,
    groomImage,
    bridePhotoUrl,
    groomPhotoUrl,
    couplePhotoUrl,
    venueImage: docData.venueImage || "",
    galleryImages,
    images: {
      couple: coupleImage,
      bride: brideImage,
      groom: groomImage,
      gallery: galleryImages,
    },

    // Optional Family & Story (Null if not provided by customer)
    grandparents,
    story,

    // System Status
    websiteStatus: docData.websiteStatus || "published",
    websiteUrl: docData.websiteUrl || `https://cards.webryza.in/card=${safeId}`,
    aiVideoRequired,
    aiVideoStatus: videoStatus,
    videoRequired,
    videoStyle,
  };
}
