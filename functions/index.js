const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function to securely handle wedding registrations.
 * Validates data, enforces partner existence/active status, and calculates commissions.
 */
exports.submitWeddingRegistration = functions.https.onCall(async (data, context) => {
  const { formData, partnerRef } = data;

  if (!formData) {
    throw new functions.https.HttpsError("invalid-argument", "Form data is required");
  }

  const {
    brideName,
    groomName,
    brideParents,
    groomParents,
    phone,
    email,
    weddingDate,
    weddingTime,
    venueName,
    venueAddress,
    venueLocation,
    additionalDetails,
    events,
    aiVideoRequired,
    amountCharged,
  } = formData;

  if (!brideName || !groomName || !brideParents || !groomParents || !phone || !weddingDate || !weddingTime || !venueName || !venueAddress) {
    throw new functions.https.HttpsError("invalid-argument", "All required fields must be filled.");
  }

  const amount = Number(amountCharged);
  if (isNaN(amount) || amount < 1500) {
    throw new functions.https.HttpsError("invalid-argument", "Amount must be at least ₹1,500.");
  }

  // Calculate commissions
  const webryzaShare = amount < 2000 ? 1000 : 1500;

  let validatedPartnerId = "";
  let validatedShopName = "Direct";
  let source = "direct";
  let partnerCommission = 0;

  if (partnerRef && typeof partnerRef === "string" && partnerRef.trim() !== "") {
    const cleanRef = partnerRef.trim();
    const partnerDoc = await db.collection("wedding_partners").doc(cleanRef).get();
    
    if (partnerDoc.exists && (partnerDoc.data().isActive === true || partnerDoc.data().isActive === "true")) {
      validatedPartnerId = cleanRef;
      validatedShopName = partnerDoc.data().shopName || cleanRef;
      source = "partner";
      partnerCommission = Math.max(0, amount - webryzaShare);
    }
  }

  // Write to wedding_cards
  const docRef = await db.collection("wedding_cards").add({
    brideName: brideName.trim(),
    groomName: groomName.trim(),
    brideParents: brideParents.trim(),
    groomParents: groomParents.trim(),
    phone: phone.trim(),
    email: (email || "").trim(),
    weddingDate: admin.firestore.Timestamp.fromDate(new Date(weddingDate)),
    weddingTime: weddingTime.trim(),
    venueName: venueName.trim(),
    venueAddress: venueAddress.trim(),
    venueLocation: (venueLocation || "").trim(),
    additionalDetails: (additionalDetails || "").trim(),
    events: events || [],
    aiVideoRequired: Boolean(aiVideoRequired),
    aiVideoStatus: "pending",
    partnerId: validatedPartnerId,
    partnerShopName: validatedShopName,
    source: source,
    amountCharged: amount,
    webryzaShare: webryzaShare,
    partnerCommission: partnerCommission,
    amountReceivedByWebryza: 0,
    amountDueToWebryza: webryzaShare,
    status: "confirmed",
    paymentStatus: "pending",
    websiteUrl: "",
    adminNotes: "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    id: docRef.id,
    source,
    partnerShopName: validatedShopName,
    webryzaShare,
    partnerCommission,
  };
});
