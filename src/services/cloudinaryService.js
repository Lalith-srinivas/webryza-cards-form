import { compressImage } from "../utils/imageCompressor";

/**
 * Cloudinary Upload Service for WebRyza Cards
 * 
 * Supports:
 * 1. Primary: Secure Signed Upload via Vercel Serverless Function (/api/cloudinary-sign)
 * 2. Fallback: Direct Upload with VITE_CLOUDINARY_UPLOAD_PRESET (for local Vite dev testing)
 */

export async function uploadWeddingPhoto(file, photoType = "couple", onProgress = null) {
  if (!file) {
    throw new Error("No photo file provided for upload.");
  }

  // 1. Client-Side Image Compression & Resizing
  const compressedFile = await compressImage(file, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.82,
  });

  if (onProgress) onProgress(30);

  // 2. Attempt Signed Upload via Vercel API Endpoint (/api/cloudinary-sign)
  let signatureData = null;
  try {
    const signResponse = await fetch("/api/cloudinary-sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        photoType,
      }),
    });

    if (signResponse.ok) {
      signatureData = await signResponse.json();
    }
  } catch (err) {
    console.warn("Could not reach /api/cloudinary-sign (expected in standalone local Vite dev):", err);
  }

  if (onProgress) onProgress(50);

  // 3A. Perform Signed Upload if signature was obtained
  if (signatureData && signatureData.signature && signatureData.apiKey && signatureData.cloudName) {
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder || "webryza/weddings");

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const errJson = await uploadRes.json().catch(() => ({}));
      throw new Error(
        errJson?.error?.message || `Cloudinary upload failed with status ${uploadRes.status}`
      );
    }

    const result = await uploadRes.json();
    if (onProgress) onProgress(100);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  // 3B. Fallback for Local Dev with Environment Variables
  const localCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const localPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (localCloudName && localPreset) {
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("upload_preset", localPreset);
    formData.append("folder", "webryza/weddings");

    const uploadUrl = `https://api.cloudinary.com/v1_1/${localCloudName}/image/upload`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const errJson = await uploadRes.json().catch(() => ({}));
      throw new Error(
        errJson?.error?.message || `Local Cloudinary preset upload failed: ${uploadRes.status}`
      );
    }

    const result = await uploadRes.json();
    if (onProgress) onProgress(100);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  // 3C. Error guidance if no Cloudinary configuration is present
  throw new Error(
    "Cloudinary is not yet configured. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel project settings (or in .env for local testing)."
  );
}
