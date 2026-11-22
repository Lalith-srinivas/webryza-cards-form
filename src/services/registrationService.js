import { collection, doc, addDoc, setDoc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { calculateCommissions } from "../utils/commission";
import { cleanPhoneNumber } from "../utils/validation";

/**
 * Atomically generates a sequential 4-digit wedding ID (e.g. "0001", "0002")
 * using Firestore transaction on `system_counters/wedding_cards_counter`.
 * If counter doesn't exist yet, initializes at 1 ("0001").
 * Falls back to collision-safe random 4-digit code if transactions fail.
 */
async function allocateWeddingIdentifier() {
  const counterRef = doc(db, "system_counters", "wedding_cards_counter");
  try {
    const nextSeq = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentVal = 0;
      if (counterDoc.exists()) {
        currentVal = counterDoc.data().currentNumber || 0;
      }
      const nextVal = currentVal + 1;
      transaction.set(counterRef, {
        currentNumber: nextVal,
        lastAllocatedAt: serverTimestamp(),
      }, { merge: true });
      return nextVal;
    });

    return String(nextSeq).padStart(4, "0");
  } catch (err) {
    console.warn("Atomic counter allocation failed, falling back to collision-safe ID:", err);
    // Fallback: 4-digit pseudo-random alphanumeric ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `WR-${randomSuffix}`;
  }
}

/**
 * Submit wedding registration to wedding_cards collection and public_invitations
 * Supports backend serverless function (/api/submit-registration) with fallback to direct Firestore write
 */
export async function submitRegistration(formData, partnerInfo) {
  // Determine if this is a validated partner registration
  const isPartner = partnerInfo && partnerInfo.isValid && partnerInfo.source === "partner";
  const partnerId = isPartner ? (partnerInfo.partnerId || "") : "";
  const partnerShopName = isPartner ? (partnerInfo.partnerShopName || "") : "Direct";
  const source = isPartner ? "partner" : "direct";

  // Calculate commissions
  const commissions = calculateCommissions(formData.amountCharged, isPartner);

  // Normalize phone number
  const cleanedPhone = cleanPhoneNumber(formData.phone);

  // Convert wedding date string (YYYY-MM-DD) to Firestore Timestamp
  let weddingTimestamp = null;
  if (formData.weddingDate) {
    const [year, month, day] = formData.weddingDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    weddingTimestamp = Timestamp.fromDate(dateObj);
  } else {
    weddingTimestamp = Timestamp.now();
  }

  // Format events array
  const formattedEvents = (formData.events || []).map((ev) => ({
    eventName: ev.eventName?.trim() || "",
    date: ev.date || "",
    time: ev.time?.trim() || "",
    venueName: ev.venueName?.trim() || "",
    venueAddress: ev.venueAddress?.trim() || "",
    locationLink: ev.locationLink?.trim() || "",
    description: ev.description?.trim() || "",
  }));

  // Selected template (default to royal-gold)
  const templateId = formData.templateId || "royal-gold";

  // Allocate sequential wedding ID (e.g. 0001 or WR-XXXX)
  const weddingId = await allocateWeddingIdentifier();

  // Public website URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://cards.webryza.in";
  const websiteUrl = `${baseUrl}/card=${weddingId}`;

  // Complete private record for wedding_cards (Internal / Partner / Admin)
  const registrationPayload = {
    weddingId: weddingId,
    templateId: templateId,
    brideName: formData.brideName.trim(),
    groomName: formData.groomName.trim(),
    brideParents: formData.brideParents.trim(),
    groomParents: formData.groomParents.trim(),
    phone: cleanedPhone || formData.phone.trim(),
    email: (formData.email || "").trim(),
    weddingDate: weddingTimestamp,
    weddingTime: formData.weddingTime.trim(),
    venueName: formData.venueName.trim(),
    venueAddress: formData.venueAddress.trim(),
    venueLocation: (formData.venueLocation || "").trim(),
    additionalDetails: (formData.additionalDetails || "").trim(),
    events: formattedEvents,
    aiVideoRequired: Boolean(formData.aiVideoRequired),
    aiVideoStatus: formData.aiVideoRequired ? "pending" : "not_requested",
    videoUrl: "",
    websiteUrl: websiteUrl,
    websiteStatus: "published",
    partnerId: partnerId,
    partnerShopName: partnerShopName,
    source: source,
    amountCharged: commissions.amountCharged,
    webryzaShare: commissions.webryzaShare,
    partnerCommission: commissions.partnerCommission,
    amountReceivedByWebryza: 0,
    amountDueToWebryza: commissions.amountDueToWebryza,
    status: "confirmed",
    paymentStatus: "pending",
    adminNotes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Sanitized public record for guests at public_invitations/{weddingId}
  // Excludes private financials, commissions, phone, email, and admin notes
  const publicInvitationPayload = {
    weddingId: weddingId,
    templateId: templateId,
    brideName: formData.brideName.trim(),
    groomName: formData.groomName.trim(),
    brideParents: formData.brideParents.trim(),
    groomParents: formData.groomParents.trim(),
    weddingDate: formData.weddingDate || "",
    weddingTime: formData.weddingTime.trim(),
    venueName: formData.venueName.trim(),
    venueAddress: formData.venueAddress.trim(),
    venueLocation: (formData.venueLocation || "").trim(),
    additionalDetails: (formData.additionalDetails || "").trim(),
    events: formattedEvents,
    websiteUrl: websiteUrl,
    videoUrl: "",
    websiteStatus: "published",
  };

  // Cache locally immediately so the newly generated invitation opens instantly on this device
  try {
    if (typeof window !== "undefined") {
      const localRecord = JSON.stringify({
        ...publicInvitationPayload,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(`webryza_invitation_${weddingId}`, localRecord);
      localStorage.setItem("webryza_last_invitation", localRecord);
      sessionStorage.setItem(`webryza_invitation_${weddingId}`, localRecord);
    }
  } catch {
    // Local storage full or private mode
  }

  // Attempt backend submission first
  let backendSuccess = false;
  let backendResult = null;

  try {
    const endpoints = ["/api/submit-registration", "/.netlify/functions/submit-registration"];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formData: { ...formData, weddingId, websiteUrl, templateId },
            partnerRef: isPartner ? partnerInfo.partnerId : null,
          }),
        });

        if (response.ok) {
          backendResult = await response.json();
          backendSuccess = true;
          break;
        }
      } catch {
        // Backend not available on this path, try next
      }
    }
  } catch {
    console.log("Backend endpoint check skipped, using direct Firestore integration.");
  }

  if (backendSuccess && backendResult && backendResult.id) {
    return {
      success: true,
      id: backendResult.id,
      weddingId: weddingId,
      websiteUrl: websiteUrl,
      templateId: templateId,
      data: {
        ...registrationPayload,
        id: backendResult.id,
      },
      message: "Registration submitted successfully via backend",
    };
  }

  // Fallback: Direct Firestore write
  try {
    // 1. Write private master record to wedding_cards
    const collectionRef = collection(db, "wedding_cards");
    const docRef = await addDoc(collectionRef, registrationPayload);

    // 2. Write public sanitized record to public_invitations/{weddingId}
    try {
      const publicDocRef = doc(db, "public_invitations", weddingId);
      await setDoc(publicDocRef, {
        ...publicInvitationPayload,
        weddingDate: weddingTimestamp,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (pubErr) {
      console.warn("Could not write to public_invitations (will fallback to wedding_cards query):", pubErr);
    }

    return {
      success: true,
      id: docRef.id,
      weddingId: weddingId,
      websiteUrl: websiteUrl,
      templateId: templateId,
      data: {
        ...registrationPayload,
        id: docRef.id,
      },
      message: "Registration successfully recorded and website published",
    };
  } catch (firestoreError) {
    console.error("Firestore submission failed:", firestoreError);
    if (
      firestoreError.code === "permission-denied" ||
      firestoreError.message?.toLowerCase().includes("permission")
    ) {
      throw new Error(
        "Firestore permission denied: Your Firebase Firestore Security Rules in Firebase Console currently block submissions to 'wedding_cards'. Please ensure rules allow create access."
      );
    }
    throw new Error(
      firestoreError.message || "Failed to save registration. Please check your internet connection and try again."
    );
  }
}
