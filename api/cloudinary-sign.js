import crypto from "crypto";

/**
 * Vercel Serverless Function: Cloudinary Upload Signature Generator
 * 
 * Securely signs client-side Cloudinary upload parameters using the Cloudinary API Secret.
 * The API secret is NEVER exposed to client-side frontend code.
 * 
 * Target Endpoint: POST /api/cloudinary-sign
 */
export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed. Use POST to generate upload signatures.",
    });
  }

  // Load server-side credentials
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      error: "Cloudinary credentials missing in server environment variables. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    });
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    // Sandboxed folder namespace to prevent overwriting
    const folder = "webryza/weddings";

    // Build parameters to sign (sorted alphabetically by key)
    const paramsToSign = {
      folder,
      timestamp,
    };

    const sortedKeys = Object.keys(paramsToSign).sort();
    const serializedParams = sortedKeys
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    // Cloudinary signature formula: SHA-1(serializedParams + apiSecret)
    const stringToSign = `${serializedParams}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    return res.status(200).json({
      success: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  } catch (err) {
    console.error("Cloudinary signature generation failed:", err);
    return res.status(500).json({
      error: "Failed to generate Cloudinary signature. " + (err.message || ""),
    });
  }
}
