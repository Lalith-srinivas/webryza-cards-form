import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, Link, Navigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import RoyalGold from "../templates/RoyalGold";
import TempleHeritage from "../templates/TempleHeritage";
import ElegantPastel from "../templates/ElegantPastel";
import LakeComoLetters from "../templates/LakeComoLetters";
import { Heart, AlertCircle, ArrowLeft, RefreshCw, Sparkles, ExternalLink } from "lucide-react";

const TEMPLATE_COMPONENTS = {
  "royal-gold": RoyalGold,
  "temple-heritage": TempleHeritage,
  "vishu-kavya": TempleHeritage,
  "elegant-pastel-romance": ElegantPastel,
  "elegant-pastel": ElegantPastel,
  "pastel-romance": ElegantPastel,
  "lakecomo-letters": LakeComoLetters,
  "lake-como-letters": LakeComoLetters,
  "lake-como": LakeComoLetters,
};

/**
 * Public Wedding Invitation Page
 * Supports exact URLs such as:
 * - https://cards.webryza.in/card=WR-1691
 * - https://cards.webryza.in/card=WR-3003
 * - https://cards.webryza.in/card=0001
 * - /card/WR-1691
 */
export default function PublicInvitationPage() {
  const { cardId: paramCardId, cardSlug } = useParams();
  const location = useLocation();

  // Determine if current URL is a wedding card URL
  const checkIsCardUrl = () => {
    if (paramCardId) return true;
    if (cardSlug && /^card[=/-]/i.test(cardSlug)) return true;
    const pathname = decodeURIComponent(location.pathname);
    if (/^\/card[=/-]/i.test(pathname)) return true;
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("card") || searchParams.get("id")) return true;
    return false;
  };

  const isCardUrl = checkIsCardUrl();

  // Robust wedding identifier extraction
  const extractCardId = () => {
    // 1. From paramCardId (e.g. /card/:cardId)
    if (paramCardId) {
      return paramCardId.replace(/^=/, "").trim();
    }

    // 2. From cardSlug (e.g. /:cardSlug where cardSlug = "card=WR-1691")
    if (cardSlug) {
      const slugMatch = cardSlug.match(/^card[=/-]?([A-Za-z0-9_-]+)/i);
      if (slugMatch && slugMatch[1]) {
        return slugMatch[1].trim();
      }
      if (cardSlug.startsWith("card=")) {
        return cardSlug.substring(5).trim();
      }
    }

    // 3. From location.pathname (e.g. "/card=WR-1691" or "/card=0001")
    const pathname = decodeURIComponent(location.pathname);
    const pathMatch = pathname.match(/\/card[=/-]?([A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].trim();
    }

    // 4. Query param fallback (?card=WR-1691 or ?id=WR-1691)
    const searchParams = new URLSearchParams(location.search);
    const qId = searchParams.get("card") || searchParams.get("id");
    if (qId) return qId.trim();

    return "";
  };

  const weddingIdentifier = extractCardId();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weddingData, setWeddingData] = useState(null);
  const [templateId, setTemplateId] = useState("royal-gold");

  // Fetch wedding invitation from Firestore wedding_cards
  const fetchWeddingInvitation = useCallback(async () => {
    if (!weddingIdentifier) {
      setError("No wedding invitation identifier provided in the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let docData = null;

      // Variants to search: original, uppercase, lowercase, and without WR- prefix if applicable
      const idVariants = Array.from(
        new Set([
          weddingIdentifier,
          weddingIdentifier.toUpperCase(),
          weddingIdentifier.toLowerCase(),
          weddingIdentifier.replace(/^WR-/i, ""),
        ])
      ).filter(Boolean);

      // =========================================================================
      // 1. Search wedding_cards collection (Primary project storage)
      // =========================================================================
      const cardsCollection = collection(db, "wedding_cards");

      for (const idVar of idVariants) {
        if (docData) break;

        // A. Direct doc lookup by ID
        try {
          const directRef = doc(db, "wedding_cards", idVar);
          const directSnap = await getDoc(directRef);
          if (directSnap.exists()) {
            docData = { id: directSnap.id, ...directSnap.data() };
            break;
          }
        } catch {
          // Continue to queries
        }

        // B. Query where weddingId == idVar
        try {
          const qWeddingId = query(cardsCollection, where("weddingId", "==", idVar));
          const snapWeddingId = await getDocs(qWeddingId);
          if (!snapWeddingId.empty) {
            docData = { id: snapWeddingId.docs[0].id, ...snapWeddingId.docs[0].data() };
            break;
          }
        } catch {
          // Continue
        }

        // C. Query where id == idVar
        try {
          const qId = query(cardsCollection, where("id", "==", idVar));
          const snapId = await getDocs(qId);
          if (!snapId.empty) {
            docData = { id: snapId.docs[0].id, ...snapId.docs[0].data() };
            break;
          }
        } catch {
          // Continue
        }

        // D. Query where cardId == idVar
        try {
          const qCardId = query(cardsCollection, where("cardId", "==", idVar));
          const snapCardId = await getDocs(qCardId);
          if (!snapCardId.empty) {
            docData = { id: snapCardId.docs[0].id, ...snapCardId.docs[0].data() };
            break;
          }
        } catch {
          // Continue
        }
      }

      // =========================================================================
      // 2. Search public_invitations collection (Sanitized fallback)
      // =========================================================================
      if (!docData) {
        const publicCollection = collection(db, "public_invitations");
        for (const idVar of idVariants) {
          if (docData) break;

          try {
            const pubRef = doc(db, "public_invitations", idVar);
            const pubSnap = await getDoc(pubRef);
            if (pubSnap.exists()) {
              docData = { id: pubSnap.id, ...pubSnap.data() };
              break;
            }
          } catch {
            // Continue
          }

          try {
            const qPub = query(publicCollection, where("weddingId", "==", idVar));
            const snapPub = await getDocs(qPub);
            if (!snapPub.empty) {
              docData = { id: snapPub.docs[0].id, ...snapPub.docs[0].data() };
              break;
            }
          } catch {
            // Continue
          }
        }
      }

      // If document was not found after checking all variants
      if (!docData) {
        setError(
          `Wedding invitation "${weddingIdentifier}" was not found in our records. Please verify the URL on your invitation card.`
        );
        setLoading(false);
        return;
      }

      // Determine template ID (defaults to royal-gold if omitted)
      const rawTemplate = (docData.templateId || "royal-gold").toLowerCase().trim();
      let normalizedTemplate = "royal-gold";
      if (rawTemplate.includes("temple") || rawTemplate.includes("vishu") || rawTemplate.includes("heritage")) {
        normalizedTemplate = "temple-heritage";
      } else if (rawTemplate.includes("pastel") || rawTemplate.includes("romance")) {
        normalizedTemplate = "elegant-pastel-romance";
      } else if (rawTemplate.includes("lake") || rawTemplate.includes("letters") || rawTemplate.includes("como")) {
        normalizedTemplate = "lakecomo-letters";
      } else {
        normalizedTemplate = "royal-gold";
      }

      // Format wedding date (YYYY-MM-DD or readable string)
      let formattedDate = "";
      if (docData.weddingDate) {
        if (typeof docData.weddingDate === "string") {
          formattedDate = docData.weddingDate;
        } else if (docData.weddingDate.toDate) {
          const d = docData.weddingDate.toDate();
          formattedDate = d.toISOString().split("T")[0];
        }
      }

      // Normalize events array
      const normalizedEvents = (docData.events || []).map((ev) => ({
        name: ev.eventName || ev.name || "Wedding Celebration",
        eventName: ev.eventName || ev.name || "Wedding Celebration",
        date: ev.date || formattedDate,
        time: ev.time || docData.weddingTime || "",
        venue: ev.venueName || ev.venue || docData.venueName || "",
        venueName: ev.venueName || ev.venue || docData.venueName || "",
        address: ev.venueAddress || ev.address || docData.venueAddress || "",
        venueAddress: ev.venueAddress || ev.address || docData.venueAddress || "",
        mapLink: ev.locationLink || ev.mapLink || docData.venueLocation || "",
        googleMapsLink: ev.locationLink || ev.mapLink || docData.venueLocation || "",
        description: ev.description || "",
      }));

      // PRIVACY ENFORCEMENT: Expose ONLY public wedding details.
      // Strict exclusion: phone, email, amountCharged, webryzaShare, partnerCommission,
      // partnerId, partnerShopName, amountDueToWebryza, adminNotes, paymentStatus.
      const safeWeddingPayload = {
        weddingId: docData.weddingId || weddingIdentifier,
        templateId: normalizedTemplate,
        brideName: docData.brideName || "The Bride",
        groomName: docData.groomName || "The Groom",
        brideParents: docData.brideParents || "",
        groomParents: docData.groomParents || "",
        weddingDate: formattedDate,
        weddingTime: docData.weddingTime || "",
        venueName: docData.venueName || "",
        venueAddress: docData.venueAddress || "",
        googleMapsLink: docData.venueLocation || docData.googleMapsLink || "",
        venueLocation: docData.venueLocation || "",
        events: normalizedEvents,
        videoUrl: docData.videoUrl || "",
        hashtag:
          docData.hashtag ||
          `#${(docData.brideName || "Bride").replace(/\s+/g, "")}And${(docData.groomName || "Groom").replace(/\s+/g, "")}`,
        additionalDetails: docData.additionalDetails || "",
      };

      setTemplateId(normalizedTemplate);
      setWeddingData(safeWeddingPayload);
      setLoading(false);
    } catch (err) {
      console.error("Error loading wedding invitation from Firestore:", err);
      if (err.code === "permission-denied" || err.message?.toLowerCase().includes("permission")) {
        setError(
          "Permission denied while accessing wedding record. Please ensure Firestore security rules allow read access for wedding_cards."
        );
      } else {
        setError(
          err.message || "Failed to load wedding invitation. Please check your internet connection and try again."
        );
      }
      setLoading(false);
    }
  }, [weddingIdentifier]);

  useEffect(() => {
    if (isCardUrl) {
      fetchWeddingInvitation();
    }
  }, [isCardUrl, fetchWeddingInvitation]);

  // If the path does not match a card URL pattern, redirect to home
  if (!isCardUrl) {
    return <Navigate to="/" replace />;
  }

  // Loading State - Luxury Wedding Invitation Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#140b07] flex flex-col items-center justify-center text-white px-4">
        <div className="relative flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin mb-6" />
          <div className="absolute top-4 text-[#D4AF37]">
            <Heart size={20} className="fill-[#D4AF37]/30 animate-pulse" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-[#FDF7B8] mb-2">
            Loading Wedding Invitation...
          </h2>
          <div className="flex items-center space-x-1.5 text-xs text-[#EEDEB3]/80">
            <Sparkles size={13} className="text-[#D4AF37]" />
            <span>Invitation ID: #{weddingIdentifier || "..."}</span>
          </div>
          <p className="text-[11px] text-[#A39788] tracking-widest uppercase mt-4">
            WebRyza Cards Studio
          </p>
        </div>
      </div>
    );
  }

  // Error / Not Found State - Keeps the browser URL intact without redirecting
  if (error || !weddingData) {
    return (
      <div className="min-h-screen bg-[#140b07] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1c120c] border border-[#D4AF37]/40 rounded-3xl p-8 text-center text-white shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center mb-5">
            <AlertCircle size={28} />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block mb-1">
            WebRyza Cards Studio
          </span>

          <h1 className="font-serif text-2xl font-bold text-[#FFFDF9] mb-2">
            Wedding Invitation Not Found
          </h1>

          <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-[#FDF7B8] mb-4">
            #{weddingIdentifier}
          </div>

          <p className="text-xs text-[#EEDEB3]/80 leading-relaxed mb-6">
            {error ||
              "The wedding invitation link you entered could not be found. Please check the wedding card URL or verify with the couple."}
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={fetchWeddingInvitation}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#FDF7B8] transition-all"
            >
              <RefreshCw size={14} />
              <span>Retry Loading</span>
            </button>

            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:brightness-105 text-xs font-bold text-[#25201A] transition-all shadow-md"
            >
              <ArrowLeft size={14} />
              <span>Go to WebRyza Cards</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Template Component dynamically
  const SelectedTemplateComponent = TEMPLATE_COMPONENTS[templateId] || RoyalGold;

  return (
    <div className="relative min-h-screen">
      <SelectedTemplateComponent data={weddingData} />
    </div>
  );
}
