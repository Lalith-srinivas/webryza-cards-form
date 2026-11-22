import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, Link, Navigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import RoyalGold from "../templates/RoyalGold";
import TempleHeritage from "../templates/TempleHeritage";
import ElegantPastel from "../templates/ElegantPastel";
import LakeComoLetters from "../templates/LakeComoLetters";
import { mapFirestoreToTemplateData } from "../utils/templateDataMapper";
import { sampleWeddingData } from "../templates/sampleWeddingData";
import { sampleTempleData } from "../templates/sampleTempleData";
import { samplePastelData } from "../templates/samplePastelData";
import { sampleLakeComoData } from "../templates/sampleLakeComoData";
import {
  Heart,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Eye,
  CheckCircle2,
} from "lucide-react";

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
 * - https://cards.webryza.in/card=WR-8999
 * - https://cards.webryza.in/card=WR-1691
 * - https://cards.webryza.in/card=WR-3003
 * - https://cards.webryza.in/card=0001
 * - /card/WR-8999
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
    if (paramCardId) {
      return paramCardId.replace(/^=/, "").trim();
    }

    if (cardSlug) {
      const slugMatch = cardSlug.match(/^card[=/-]?([A-Za-z0-9_-]+)/i);
      if (slugMatch && slugMatch[1]) {
        return slugMatch[1].trim();
      }
      if (cardSlug.startsWith("card=")) {
        return cardSlug.substring(5).trim();
      }
    }

    const pathname = decodeURIComponent(location.pathname);
    const pathMatch = pathname.match(/\/card[=/-]?([A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].trim();
    }

    const searchParams = new URLSearchParams(location.search);
    const qId = searchParams.get("card") || searchParams.get("id");
    if (qId) return qId.trim();

    return "";
  };

  const weddingIdentifier = extractCardId();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [weddingData, setWeddingData] = useState(null);
  const [templateId, setTemplateId] = useState("royal-gold");

  // Fetch wedding invitation from local storage or Firestore
  const fetchWeddingInvitation = useCallback(async () => {
    if (!weddingIdentifier) {
      setError("No wedding invitation identifier provided in the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsPermissionDenied(false);

    let docData = null;
    let hadPermissionError = false;

    // =========================================================================
    // 1. Search Firestore wedding_cards (Primary Database)
    // =========================================================================
    const idVariants = Array.from(
      new Set([
        weddingIdentifier,
        weddingIdentifier.toUpperCase(),
        weddingIdentifier.toLowerCase(),
        weddingIdentifier.replace(/^WR-/i, ""),
      ])
    ).filter(Boolean);

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
      } catch (err) {
        if (err.code === "permission-denied" || err.message?.toLowerCase().includes("permission")) {
          hadPermissionError = true;
        }
      }

      // B. Query where weddingId == idVar (sort by latest if multiple found)
      try {
        const qWeddingId = query(cardsCollection, where("weddingId", "==", idVar));
        const snapWeddingId = await getDocs(qWeddingId);
        if (!snapWeddingId.empty) {
          const candidateDocs = snapWeddingId.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Prioritize most recent and complete records
          candidateDocs.sort((a, b) => {
            const timeA = a.createdAt?.seconds || a.updatedAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || b.updatedAt?.seconds || 0;
            return timeB - timeA;
          });
          docData = candidateDocs[0];
          break;
        }
      } catch (err) {
        if (err.code === "permission-denied" || err.message?.toLowerCase().includes("permission")) {
          hadPermissionError = true;
        }
      }

      // C. Query where id == idVar
      try {
        const qId = query(cardsCollection, where("id", "==", idVar));
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          docData = { id: snapId.docs[0].id, ...snapId.docs[0].data() };
          break;
        }
      } catch (err) {
        if (err.code === "permission-denied" || err.message?.toLowerCase().includes("permission")) {
          hadPermissionError = true;
        }
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
        } catch (err) {
          if (err.code === "permission-denied" || err.message?.toLowerCase().includes("permission")) {
            hadPermissionError = true;
          }
        }

        try {
          const qPub = query(publicCollection, where("weddingId", "==", idVar));
          const snapPub = await getDocs(qPub);
          if (!snapPub.empty) {
            const candidateDocs = snapPub.docs.map((d) => ({ id: d.id, ...d.data() }));
            candidateDocs.sort((a, b) => {
              const timeA = a.createdAt?.seconds || a.updatedAt?.seconds || 0;
              const timeB = b.createdAt?.seconds || b.updatedAt?.seconds || 0;
              return timeB - timeA;
            });
            docData = candidateDocs[0];
            break;
          }
        } catch (err) {
          if (err.code === "permission-denied" || err.message?.toLowerCase().includes("permission")) {
            hadPermissionError = true;
          }
        }
      }
    }

    // =========================================================================
    // 3. Client-side Local Storage Check (Graceful fallback if network is offline)
    // =========================================================================
    if (!docData) {
      try {
        if (typeof window !== "undefined") {
          const localKey = `webryza_invitation_${weddingIdentifier}`;
          const storedStr = localStorage.getItem(localKey) || sessionStorage.getItem(localKey);
          if (storedStr) {
            const parsed = JSON.parse(storedStr);
            if (parsed && (parsed.brideName || parsed.weddingId)) {
              docData = parsed;
            }
          }
        }
      } catch {
        // Storage access fallback
      }
    }

    // If still not found, show user-facing error without fake placeholder overrides
    if (!docData) {
      if (hadPermissionError) {
        setIsPermissionDenied(true);
        setError(
          "Firebase Firestore Security Rules on Firebase Console currently block public read access to 'wedding_cards'."
        );
      } else {
        setError(
          `Wedding invitation "${weddingIdentifier}" was not found in our records. Please verify the URL on your invitation card.`
        );
      }
      setLoading(false);
      return;
    }

    // Centralized Data Mapping: transforms Firestore document into sanitized template payload
    const safeWeddingPayload = mapFirestoreToTemplateData(docData, weddingIdentifier);

    setTemplateId(safeWeddingPayload.templateId);
    setWeddingData(safeWeddingPayload);
    setLoading(false);
  }, [weddingIdentifier]);

  useEffect(() => {
    if (isCardUrl) {
      fetchWeddingInvitation();
    }
  }, [isCardUrl, fetchWeddingInvitation]);

  // Load sample demo fallback if user clicks preview demo
  const handleLoadSampleDemo = (demoTemplate = "temple-heritage") => {
    let sample = sampleTempleData;
    if (demoTemplate === "royal-gold") sample = sampleWeddingData;
    if (demoTemplate === "elegant-pastel-romance") sample = samplePastelData;
    if (demoTemplate === "lakecomo-letters") sample = sampleLakeComoData;

    setTemplateId(demoTemplate);
    setWeddingData({
      ...sample,
      weddingId: weddingIdentifier || "DEMO-001",
    });
    setError(null);
  };

  // If path is not a card URL, redirect to home
  if (!isCardUrl) {
    return <Navigate to="/" replace />;
  }

  // Loading State
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

  // Error / Not Found / Access Restricted State
  if (error || !weddingData) {
    return (
      <div className="min-h-screen bg-[#140b07] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#1c120c] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle size={28} />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block mb-1">
            WebRyza Cards Studio
          </span>

          <h1 className="font-serif text-2xl font-bold text-[#FFFDF9] mb-2">
            {isPermissionDenied ? "Database Access Restricted" : "Wedding Invitation Not Found"}
          </h1>

          <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-[#FDF7B8] mb-3">
            #{weddingIdentifier}
          </div>

          <p className="text-xs text-[#EEDEB3]/80 leading-relaxed mb-4">
            {error ||
              "The wedding invitation link you entered could not be found in our database records."}
          </p>

          {/* Actionable instructions if permission-denied is active in Firebase */}
          {isPermissionDenied && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-left text-xs text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <ShieldAlert size={14} />
                <span>How to fix in Firebase Console:</span>
              </div>
              <p className="text-[11px] text-amber-100 leading-relaxed">
                Go to <strong>Firebase Console &rarr; Firestore Database &rarr; Rules</strong> and update:
              </p>
              <pre className="text-[10px] bg-black/50 p-2 rounded-lg text-emerald-300 font-mono overflow-x-auto">
{`match /wedding_cards/{cardId} {
  allow read: if true;
}`}
              </pre>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleLoadSampleDemo("temple-heritage")}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:brightness-105 text-xs font-bold text-[#25201A] transition-all shadow-md"
            >
              <Eye size={14} />
              <span>Preview Demo Wedding Invitation</span>
            </button>

            <button
              type="button"
              onClick={fetchWeddingInvitation}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#FDF7B8] transition-all"
            >
              <RefreshCw size={13} />
              <span>Retry Loading</span>
            </button>

            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-medium text-white/70 hover:text-white transition-all"
            >
              <ArrowLeft size={13} />
              <span>Return to WebRyza Registration</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render the selected Wedding Template Component
  const SelectedTemplateComponent = TEMPLATE_COMPONENTS[templateId] || RoyalGold;

  return (
    <div className="relative min-h-screen">
      <SelectedTemplateComponent data={weddingData} />
    </div>
  );
}
