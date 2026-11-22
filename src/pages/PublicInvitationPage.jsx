import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import RoyalGold from "../templates/RoyalGold";
import TempleHeritage from "../templates/TempleHeritage";
import ElegantPastel from "../templates/ElegantPastel";
import LakeComoLetters from "../templates/LakeComoLetters";
import { Sparkles, Heart, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

const TEMPLATE_COMPONENTS = {
  "royal-gold": RoyalGold,
  "temple-heritage": TempleHeritage,
  "vishu-kavya": TempleHeritage,
  "elegant-pastel-romance": ElegantPastel,
  "elegant-pastel": ElegantPastel,
  "pastel-romance": ElegantPastel,
  "lakecomo-letters": LakeComoLetters,
  "lake-como-letters": LakeComoLetters,
  "lake-como": LakeComoLetters
};

/**
 * Public Wedding Invitation Page
 * Accessible via:
 * - https://cards.webryza.in/card=0001
 * - https://cards.webryza.in/card/0001
 * - /card=:cardId
 */
export default function PublicInvitationPage() {
  const { cardId: paramCardId } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weddingData, setWeddingData] = useState(null);
  const [templateId, setTemplateId] = useState("royal-gold");

  // Robust ID extraction from multiple URL formats
  const extractCardId = () => {
    if (paramCardId) return paramCardId.replace(/^=/, "").trim();

    // Match /card=0001 or /card/0001
    const match = location.pathname.match(/\/card[=/]([^/?#]+)/i);
    if (match && match[1]) return match[1].trim();

    // Search query fallback (?card=0001 or ?id=0001)
    const searchParams = new URLSearchParams(location.search);
    const qId = searchParams.get("card") || searchParams.get("id");
    if (qId) return qId.trim();

    return "";
  };

  const weddingIdentifier = extractCardId();

  useEffect(() => {
    let isMounted = true;

    async function fetchWeddingInvitation() {
      if (!weddingIdentifier) {
        if (isMounted) {
          setError("No wedding invitation identifier provided in the URL.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let docData = null;

        // 1. Try public_invitations collection (Fast & Privacy-Safe)
        try {
          // Direct Doc ID lookup
          const publicDocRef = doc(db, "public_invitations", weddingIdentifier);
          const publicSnap = await getDoc(publicDocRef);
          if (publicSnap.exists()) {
            docData = { id: publicSnap.id, ...publicSnap.data() };
          } else {
            // Query by weddingId field
            const pubQuery = query(
              collection(db, "public_invitations"),
              where("weddingId", "==", weddingIdentifier)
            );
            const pubQuerySnap = await getDocs(pubQuery);
            if (!pubQuerySnap.empty) {
              docData = { id: pubQuerySnap.docs[0].id, ...pubQuerySnap.docs[0].data() };
            }
          }
        } catch {
          // Fall through to wedding_cards lookup
        }

        // 2. Fallback: Query wedding_cards collection
        if (!docData) {
          try {
            // Query by weddingId field
            const cardsQuery = query(
              collection(db, "wedding_cards"),
              where("weddingId", "==", weddingIdentifier)
            );
            const cardsSnap = await getDocs(cardsQuery);
            if (!cardsSnap.empty) {
              docData = { id: cardsSnap.docs[0].id, ...cardsSnap.docs[0].data() };
            } else {
              // Direct Doc ID lookup in wedding_cards
              const cardDocRef = doc(db, "wedding_cards", weddingIdentifier);
              const cardDocSnap = await getDoc(cardDocRef);
              if (cardDocSnap.exists()) {
                docData = { id: cardDocSnap.id, ...cardDocSnap.data() };
              }
            }
          } catch {
            // Permission or network error
          }
        }

        if (!docData) {
          if (isMounted) {
            setError(`Wedding invitation "${weddingIdentifier}" was not found.`);
            setLoading(false);
          }
          return;
        }

        // Sanitize & Format Data payload for all templates
        const normalizedTemplate = (docData.templateId || "royal-gold").toLowerCase().trim();

        // Convert Firestore timestamp or string date to YYYY-MM-DD
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
          description: ev.description || ""
        }));

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
          hashtag: docData.hashtag || `#${(docData.brideName || "Bride").replace(/\s+/g, "")}And${(docData.groomName || "Groom").replace(/\s+/g, "")}`,
          additionalDetails: docData.additionalDetails || ""
        };

        if (isMounted) {
          setTemplateId(normalizedTemplate);
          setWeddingData(safeWeddingPayload);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading wedding invitation:", err);
          setError("Failed to load wedding invitation. Please check your connection.");
          setLoading(false);
        }
      }
    }

    fetchWeddingInvitation();

    return () => {
      isMounted = false;
    };
  }, [weddingIdentifier]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#140b07] flex flex-col items-center justify-center text-white px-4">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin mb-6" />
          <div className="absolute top-4 text-[#D4AF37]">
            <Heart size={20} className="fill-[#D4AF37]/30 animate-pulse" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-[#FDF7B8] mb-2">
            Loading Wedding Invitation...
          </h2>
          <p className="text-xs text-[#EEDEB3]/70 tracking-widest uppercase">
            WebRyza Cards • Handcrafted Digital Invitation
          </p>
        </div>
      </div>
    );
  }

  // Error / Not Found State
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

          <h1 className="font-serif text-2xl font-bold text-[#FFFDF9] mb-3">
            Invitation Not Found
          </h1>

          <p className="text-xs text-[#EEDEB3]/80 leading-relaxed mb-6">
            {error || "The wedding invitation link you entered is invalid or has expired. Please verify the URL with the couple."}
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#FDF7B8] transition-all"
            >
              <RefreshCw size={13} />
              <span>Retry Loading</span>
            </button>

            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#b8860b] text-xs font-bold text-[#25201A] transition-all shadow-md"
            >
              <ArrowLeft size={13} />
              <span>Go to WebRyza Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Template Component
  const SelectedTemplateComponent = TEMPLATE_COMPONENTS[templateId] || RoyalGold;

  return (
    <div className="relative min-h-screen">
      <SelectedTemplateComponent data={weddingData} />
    </div>
  );
}
