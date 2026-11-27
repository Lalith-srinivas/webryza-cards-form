import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, Link, Navigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import RoyalGold from "../templates/RoyalGold";
import TempleHeritage from "../templates/TempleHeritage";
import ElegantPastel from "../templates/ElegantPastel";
import LakeComoLetters from "../templates/LakeComoLetters";
import { mapFirestoreToTemplateData } from "../utils/templateDataMapper";
import { isWeddingCardTrashed } from "../utils/cardStatus";
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
  Lock,
} from "lucide-react";

const TEMPLATE_COMPONENTS = {
  "royal-gold": RoyalGold,
  "temple-heritage": TempleHeritage,
  "vishu-kavya": TempleHeritage,
  "elegant-pastel-romance": ElegantPastel,
  "elegant-pastel": ElegantPastel,
  "pastel-romance": ElegantPastel,
  "floral-botanical-romance": LakeComoLetters,
  "floral-botanical": LakeComoLetters,
  "botanical-romance": LakeComoLetters,
  "floral-romance": LakeComoLetters,
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
  const [isTrashed, setIsTrashed] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [weddingData, setWeddingData] = useState(null);
  const [templateId, setTemplateId] = useState("royal-gold");
  const [matchedDocRef, setMatchedDocRef] = useState(null);

  // Helper to clear any client-side cached data for this wedding
  const clearLocalCache = useCallback(() => {
    try {
      if (typeof window !== "undefined" && weddingIdentifier) {
        const localKey = `webryza_invitation_${weddingIdentifier}`;
        localStorage.removeItem(localKey);
        sessionStorage.removeItem(localKey);
      }
    } catch {
      // Ignore cache clearing errors
    }
  }, [weddingIdentifier]);

  // Fetch wedding invitation from local storage or Firestore
  const fetchWeddingInvitation = useCallback(async () => {
    if (!weddingIdentifier) {
      setError("No wedding invitation identifier provided in the URL.");
      setIsNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsPermissionDenied(false);
    setIsTrashed(false);
    setIsNotFound(false);

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
          setMatchedDocRef(directRef);
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
          setMatchedDocRef(doc(db, "wedding_cards", candidateDocs[0].id));
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
          setMatchedDocRef(doc(db, "wedding_cards", snapId.docs[0].id));
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
            setMatchedDocRef(pubRef);
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
            setMatchedDocRef(doc(db, "public_invitations", candidateDocs[0].id));
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
    // 3. Client-side Local Storage Check (Graceful fallback ONLY if network offline)
    // =========================================================================
    if (!docData) {
      try {
        if (typeof window !== "undefined") {
          const localKey = `webryza_invitation_${weddingIdentifier}`;
          const storedStr = localStorage.getItem(localKey) || sessionStorage.getItem(localKey);
          if (storedStr) {
            const parsed = JSON.parse(storedStr);
            if (parsed && (parsed.brideName || parsed.weddingId) && !isWeddingCardTrashed(parsed)) {
              docData = parsed;
            }
          }
        }
      } catch {
        // Storage access fallback
      }
    }

    // =========================================================================
    // 4. Validate Deletion & Existence Status
    // =========================================================================
    // If not found in records:
    if (!docData) {
      clearLocalCache();
      setIsTrashed(false);
      setIsNotFound(true);
      setWeddingData(null);
      if (hadPermissionError) {
        setIsPermissionDenied(true);
        setError("Firebase Firestore Security Rules currently block public read access.");
      } else {
        setError("Invitation Not Found");
      }
      setLoading(false);
      return;
    }

    // If record exists but is moved to Trash (soft-deleted):
    if (isWeddingCardTrashed(docData)) {
      clearLocalCache();
      setIsTrashed(true);
      setIsNotFound(false);
      setWeddingData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Record is active: Map template data and display wedding website normally
    setIsTrashed(false);
    setIsNotFound(false);
    const safeWeddingPayload = mapFirestoreToTemplateData(docData, weddingIdentifier);
    setTemplateId(safeWeddingPayload.templateId);
    setWeddingData(safeWeddingPayload);
    setLoading(false);
  }, [weddingIdentifier, clearLocalCache]);

  useEffect(() => {
    if (isCardUrl) {
      fetchWeddingInvitation();
    }
  }, [isCardUrl, fetchWeddingInvitation]);

  // Real-time listener: updates wedding data instantly when admin modifies, trashes, or restores card
  useEffect(() => {
    if (!matchedDocRef) return;

    const unsubscribe = onSnapshot(
      matchedDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const freshData = { id: snapshot.id, ...snapshot.data() };
          if (isWeddingCardTrashed(freshData)) {
            // Live moved to Trash: instantly block access and clear cached data
            clearLocalCache();
            setIsTrashed(true);
            setIsNotFound(false);
            setWeddingData(null);
          } else {
            // Live active or restored by admin: immediately render wedding website
            setIsTrashed(false);
            setIsNotFound(false);
            const safePayload = mapFirestoreToTemplateData(freshData, weddingIdentifier);
            setWeddingData(safePayload);
            setTemplateId(safePayload.templateId);
          }
        } else {
          // Permanently deleted from database
          clearLocalCache();
          setIsTrashed(false);
          setIsNotFound(true);
          setWeddingData(null);
        }
      },
      (err) => {
        console.warn("Real-time Firestore card sync notice:", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [matchedDocRef, weddingIdentifier, clearLocalCache]);

  // Scroll to top when invitation or template changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [templateId, weddingIdentifier]);

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

  // 1. Trashed / Soft-Deleted State
  if (isTrashed) {
    return (
      <div className="min-h-screen bg-[#140b07] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1c120c] border border-[#D4AF37]/30 rounded-3xl p-7 sm:p-9 text-center text-white shadow-2xl space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-[#D4AF37]/40 text-[#D4AF37] mx-auto flex items-center justify-center">
            <Lock size={26} className="text-[#D4AF37]" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block">
              WebRyza Cards Studio
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDF9]">
              Invitation Not Available
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-[#EEDEB3]/80 leading-relaxed max-w-sm mx-auto">
            This wedding invitation is currently unavailable. Please contact the person who shared this link with you.
          </p>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-medium text-white/70 hover:text-white transition-all"
            >
              <ArrowLeft size={13} />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Not Found / Permanently Deleted / Access Restricted State
  if (isNotFound || error || !weddingData) {
    return (
      <div className="min-h-screen bg-[#140b07] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1c120c] border border-white/10 rounded-3xl p-7 sm:p-9 text-center text-white shadow-2xl space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle size={28} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block">
              WebRyza Cards Studio
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDF9]">
              {isPermissionDenied ? "Database Access Restricted" : "Invitation Not Found"}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-[#EEDEB3]/80 leading-relaxed max-w-sm mx-auto">
            {isPermissionDenied
              ? "Firebase Firestore Security Rules currently restrict access to this record."
              : "The wedding invitation link you entered could not be found. Please verify the URL or contact the person who shared it with you."}
          </p>

          {isPermissionDenied && (
            <div className="mb-2 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-left text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <ShieldAlert size={14} />
                <span>Security Rules Note:</span>
              </div>
              <p className="text-[11px] text-amber-100">
                Ensure <strong>wedding_cards</strong> allows public read access in Firebase Console.
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={fetchWeddingInvitation}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#FDF7B8] transition-all"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>

            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-medium text-white/70 hover:text-white transition-all"
            >
              <ArrowLeft size={12} />
              <span>Return to Home</span>
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
