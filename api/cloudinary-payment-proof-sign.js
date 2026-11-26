import crypto from "crypto";

/**
 * Vercel Serverless Function: Cloudinary Signed Upload for Payment Proofs
 * 
 * Target Endpoint: POST /api/cloudinary-payment-proof-sign
 * 
 * Strict Security Rules:
 * 1. Only accepts POST.
 * 2. API secret is NEVER exposed to the frontend.
 * 3. File type restriction: only JPG, JPEG, and PNG.
 * 4. Maximum file size: 5 MB (5 * 1024 * 1024 bytes).
 * 5. Folder compartmentalization: webryza/payment_proofs
 * 6. Adds security tags: payment_proof
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

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed. Use POST to generate upload signatures.",
    });
  }

  const { orderRef, fileType, fileSize } = req.body || {};

  // 1. File Type Validation (strictly JPG, JPEG, PNG)
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (fileType && !allowedMimeTypes.includes(fileType.toLowerCase())) {
    return res.status(400).json({
      error: "Invalid file format. Only JPG, JPEG, and PNG payment screenshots are permitted.",
    });
  }

  // 2. File Size Validation (maximum 5 MB)
  const maxBytes = 5 * 1024 * 1024;
  if (fileSize && Number(fileSize) > maxBytes) {
    return res.status(400).json({
      error: "File exceeds 5 MB size limit. Please upload a compressed payment screenshot under 5 MB.",
    });
  }

  // 3. Cloudinary Credentials from Environment Variables
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
    // Folder namespace specifically for payment receipts
    const safeRef = String(orderRef || "draft").replace(/[^a-zA-Z0-9_-]/g, "");
    const folder = safeRef ? `webryza/payment_proofs/${safeRef}` : "webryza/payment_proofs";

    // Parameters to sign (sorted alphabetically by key)
    const paramsToSign = {
      folder,
      tags: "payment_proof",
      timestamp,
    };

    const sortedKeys = Object.keys(paramsToSign).sort();
    const serializedParams = sortedKeys
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    // SHA-1 signature formula: SHA-1(serializedParams + apiSecret)
    const stringToSign = `${serializedParams}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    return res.status(200).json({
      success: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      tags: "payment_proof",
    });
  } catch (err) {
    console.error("Payment proof signature generation failed:", err);
    return res.status(500).json({
      error: "Failed to generate payment proof upload signature. " + (err.message || ""),
    });
  }
}
