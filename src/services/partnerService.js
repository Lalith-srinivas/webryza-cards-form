import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Verify partner from wedding_partners collection
 * Supports direct doc ID matching as well as partnerId / code queries.
 */
export async function verifyPartner(refCode) {
  if (!refCode || !refCode.trim()) {
    return {
      status: "direct",
      isValid: false,
      isDirect: true,
      partnerId: "",
      partnerShopName: "Direct",
      source: "direct",
      message: "Direct registration without partner referral",
      partnerData: null
    };
  }

  const cleanRef = refCode.trim();

  try {
    // 1. Try direct document reference
    const docRef = doc(db, "wedding_partners", cleanRef);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const isActive = data.isActive === true || data.isActive === "true";
      const shopName = data.shopName || data.name || data.partnerShopName || cleanRef;

      if (isActive) {
        return {
          status: "valid",
          isValid: true,
          isDirect: false,
          partnerId: cleanRef,
          partnerShopName: shopName,
          source: "partner",
          message: `Registration through ${shopName}`,
          partnerData: data
        };
      } else {
        return {
          status: "inactive",
          isValid: false,
          isDirect: true,
          partnerId: "",
          partnerShopName: "Direct",
          source: "direct",
          message: `The partner account "${shopName}" is currently deactivated or inactive. Your registration will be processed as a direct submission.`,
          partnerData: data
        };
      }
    }

    // 2. Query wedding_partners by partnerId field
    const q = query(collection(db, "wedding_partners"), where("partnerId", "==", cleanRef));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const partnerDoc = querySnap.docs[0];
      const data = partnerDoc.data();
      const isActive = data.isActive === true || data.isActive === "true";
      const shopName = data.shopName || data.name || data.partnerShopName || cleanRef;

      if (isActive) {
        return {
          status: "valid",
          isValid: true,
          isDirect: false,
          partnerId: data.partnerId || partnerDoc.id,
          partnerShopName: shopName,
          source: "partner",
          message: `Registration through ${shopName}`,
          partnerData: data
        };
      } else {
        return {
          status: "inactive",
          isValid: false,
          isDirect: true,
          partnerId: "",
          partnerShopName: "Direct",
          source: "direct",
          message: `Partner shop "${shopName}" is currently inactive. Registration will proceed as direct.`,
          partnerData: data
        };
      }
    }

    // 3. Fallback query by "code" or "id"
    const qCode = query(collection(db, "wedding_partners"), where("code", "==", cleanRef));
    const codeSnap = await getDocs(qCode);
    if (!codeSnap.empty) {
      const partnerDoc = codeSnap.docs[0];
      const data = partnerDoc.data();
      const isActive = data.isActive === true || data.isActive === "true";
      const shopName = data.shopName || data.name || data.partnerShopName || cleanRef;

      if (isActive) {
        return {
          status: "valid",
          isValid: true,
          isDirect: false,
          partnerId: data.partnerId || data.code || partnerDoc.id,
          partnerShopName: shopName,
          source: "partner",
          message: `Registration through ${shopName}`,
          partnerData: data
        };
      }
    }

    // If not found in any
    return {
      status: "invalid",
      isValid: false,
      isDirect: true,
      partnerId: "",
      partnerShopName: "Direct",
      source: "direct",
      message: `Partner reference code "${cleanRef}" is invalid or not found. Your registration will be safely processed as a direct registration.`,
      partnerData: null
    };
  } catch (error) {
    console.warn("Error querying wedding_partners:", error);
    // In case of permission errors or network issues
    return {
      status: "error",
      isValid: false,
      isDirect: true,
      partnerId: "",
      partnerShopName: "Direct",
      source: "direct",
      message: `Could not verify partner code "${cleanRef}". Proceeding with direct registration.`,
      partnerData: null,
      error: error.message
    };
  }
}
