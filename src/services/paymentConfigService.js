import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Service to retrieve the active UPI payment configuration from Firestore:
 * Document: app_settings/payment_config
 * 
 * Expected schema:
 * {
 *   upiId: "webryza@upi",
 *   upiDisplayName: "WebRyza",
 *   updatedAt: timestamp
 * }
 */
export async function fetchPaymentConfig() {
  try {
    const configDocRef = doc(db, "app_settings", "payment_config");
    const docSnap = await getDoc(configDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const upiId = (data.upiId || "").trim();
      const upiDisplayName = (data.upiDisplayName || "WebRyza").trim();

      if (upiId && upiId.includes("@")) {
        return {
          success: true,
          config: {
            upiId,
            upiDisplayName,
            updatedAt: data.updatedAt || null,
          },
        };
      }
    }

    // Default configuration fallback if document has not yet been initialized by Admin
    // Ensures customers are never blocked while preserving configurable schema
    const envUpiId = import.meta.env.VITE_WEBRYZA_UPI_ID || "webryza@upi";
    const envDisplayName = import.meta.env.VITE_WEBRYZA_DISPLAY_NAME || "WebRyza";

    return {
      success: true,
      config: {
        upiId: envUpiId,
        upiDisplayName: envDisplayName,
        isFallback: true,
      },
    };
  } catch (err) {
    console.error("Error fetching payment configuration from Firestore:", err);

    // If Firestore read fails due to offline/network, use documented default
    const envUpiId = import.meta.env.VITE_WEBRYZA_UPI_ID || "webryza@upi";
    const envDisplayName = import.meta.env.VITE_WEBRYZA_DISPLAY_NAME || "WebRyza";

    if (envUpiId) {
      return {
        success: true,
        config: {
          upiId: envUpiId,
          upiDisplayName: envDisplayName,
          isFallback: true,
        },
      };
    }

    return {
      success: false,
      error: "Active UPI payment configuration is temporarily unavailable. Please try again or contact WebRyza support.",
    };
  }
}
