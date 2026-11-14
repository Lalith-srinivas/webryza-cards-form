/**
 * Netlify Serverless Function: submit-registration
 * Handles secure server-side validation, partner verification,
 * commission calculation, and Firestore submission.
 */

// If firebase-admin is available in environment, use it; otherwise provide response format
exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { formData, partnerRef } = JSON.parse(event.body || "{}");

    if (!formData) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing formData in request body" }),
      };
    }

    // Required fields check
    const required = ["brideName", "groomName", "brideParents", "groomParents", "phone", "weddingDate", "weddingTime", "venueName", "venueAddress", "amountCharged"];
    for (const field of required) {
      if (!formData[field] || String(formData[field]).trim() === "") {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: `Field '${field}' is required.` }),
        };
      }
    }

    // Amount validation
    const amount = Number(formData.amountCharged);
    if (isNaN(amount) || amount < 1500) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Minimum amount charged must be at least ₹1,500." }),
      };
    }

    // Server-side commission calculation
    const webryzaShare = amount < 2000 ? 1000 : 1500;
    const isPartner = Boolean(partnerRef && String(partnerRef).trim() !== "");
    const partnerCommission = isPartner ? Math.max(0, amount - webryzaShare) : 0;

    // In Netlify functions with firebase-admin credentials:
    // (Optional service account credentials in environment variables)
    let docId = "WC-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Check if firebase-admin is loaded
    try {
      const admin = require("firebase-admin");
      if (!admin.apps.length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
          });
        } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID || "webryza-admin",
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            }),
          });
        }
      }

      if (admin.apps.length > 0) {
        const firestore = admin.firestore();
        
        let validatedPartnerId = "";
        let validatedShopName = "Direct";
        let source = "direct";

        if (isPartner) {
          const partnerDoc = await firestore.collection("wedding_partners").doc(partnerRef).get();
          if (partnerDoc.exists && partnerDoc.data().isActive) {
            validatedPartnerId = partnerRef;
            validatedShopName = partnerDoc.data().shopName || partnerRef;
            source = "partner";
          }
        }

        const docRef = await firestore.collection("wedding_cards").add({
          brideName: formData.brideName.trim(),
          groomName: formData.groomName.trim(),
          brideParents: formData.brideParents.trim(),
          groomParents: formData.groomParents.trim(),
          phone: formData.phone.trim(),
          email: (formData.email || "").trim(),
          weddingDate: admin.firestore.Timestamp.fromDate(new Date(formData.weddingDate)),
          weddingTime: formData.weddingTime.trim(),
          venueName: formData.venueName.trim(),
          venueAddress: formData.venueAddress.trim(),
          venueLocation: (formData.venueLocation || "").trim(),
          additionalDetails: (formData.additionalDetails || "").trim(),
          events: formData.events || [],
          aiVideoRequired: Boolean(formData.aiVideoRequired),
          aiVideoStatus: "pending",
          partnerId: validatedPartnerId,
          partnerShopName: validatedShopName,
          source: source,
          amountCharged: amount,
          webryzaShare: webryzaShare,
          partnerCommission: source === "partner" ? partnerCommission : 0,
          amountReceivedByWebryza: 0,
          amountDueToWebryza: webryzaShare,
          status: "confirmed",
          paymentStatus: "pending",
          websiteUrl: "",
          adminNotes: "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        docId = docRef.id;
      }
    } catch (adminErr) {
      console.log("Firebase Admin not configured in Netlify function environment, deferring to frontend Firestore write.");
      return {
        statusCode: 501,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Firebase Admin not configured on server, client direct mode active" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        id: docId,
        webryzaShare,
        partnerCommission: isPartner ? partnerCommission : 0,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};
