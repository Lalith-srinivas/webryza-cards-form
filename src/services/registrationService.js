import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { calculateCommissions } from "../utils/commission";
import { cleanPhoneNumber } from "../utils/validation";

/**
 * Submit wedding registration to wedding_cards collection
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
    const [year, month, day] = formData.weddingDate.split('-').map(Number);
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
    description: ev.description?.trim() || ""
  }));

  // Prepare Firestore document structure
  const registrationPayload = {
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
    aiVideoStatus: "pending",
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
    websiteUrl: "",
    adminNotes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Attempt backend submission first (e.g. Netlify Function / Express API)
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
            formData,
            partnerRef: isPartner ? partnerInfo.partnerId : null,
          }),
        });

        if (response.ok) {
          backendResult = await response.json();
          backendSuccess = true;
          break;
        }
      } catch (err) {
        // Backend not available on this path, try next or fallback
      }
    }
  } catch (err) {
    console.log("Backend endpoint check skipped, using direct Firestore integration.");
  }

  if (backendSuccess && backendResult && backendResult.id) {
    return {
      success: true,
      id: backendResult.id,
      data: {
        ...registrationPayload,
        id: backendResult.id,
      },
      message: "Registration submitted successfully via backend",
    };
  }

  // Fallback: Direct Firestore write using the Firebase Web SDK
  try {
    const collectionRef = collection(db, "wedding_cards");
    const docRef = await addDoc(collectionRef, registrationPayload);

    return {
      success: true,
      id: docRef.id,
      data: {
        ...registrationPayload,
        id: docRef.id,
      },
      message: "Registration successfully recorded in wedding_cards",
    };
  } catch (firestoreError) {
    console.error("Firestore submission failed:", firestoreError);
    if (
      firestoreError.code === "permission-denied" ||
      firestoreError.message?.toLowerCase().includes("permission")
    ) {
      throw new Error(
        "Firestore permission denied: Your Firebase Firestore Security Rules in Firebase Console currently block public submissions to 'wedding_cards'. Please update your Firestore Rules to allow create access for wedding_cards."
      );
    }
    throw new Error(
      firestoreError.message || "Failed to save registration. Please check your internet connection and try again."
    );
  }
}
