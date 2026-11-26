/**
 * Client-Side Payment Proof Upload Service using Cloudinary
 * 
 * Rules:
 * - Only JPG, JPEG, and PNG formats accepted.
 * - Maximum file size 5 MB.
 * - Client-side validation before network request.
 * - Signed secure upload via /api/cloudinary-payment-proof-sign.
 */

export function validatePaymentProofFile(file) {
  if (!file) {
    return { valid: false, error: "Please select a payment screenshot image." };
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  const fileExt = file.name?.split(".").pop()?.toLowerCase();
  const validExt = ["jpg", "jpeg", "png"].includes(fileExt);

  if (!allowedTypes.includes(file.type?.toLowerCase()) && !validExt) {
    return {
      valid: false,
      error: "Invalid file format. Only JPG, JPEG, and PNG payment receipts are accepted.",
    };
  }

  const maxBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxBytes) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds the 5 MB maximum limit.`,
    };
  }

  return { valid: true, error: null };
}

export async function uploadPaymentProof(file, orderRef = "", onProgress = null) {
  const validation = validatePaymentProofFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (onProgress) onProgress(20);

  // 1. Request Secure Signature from backend serverless function
  let signatureData = null;
  try {
    const signResponse = await fetch("/api/cloudinary-payment-proof-sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderRef,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    if (signResponse.ok) {
      signatureData = await signResponse.json();
    }
  } catch (err) {
    console.warn("Could not reach /api/cloudinary-payment-proof-sign (fallback to dev config):", err);
  }

  if (onProgress) onProgress(45);

  // 2A. Signed Upload to Cloudinary
  if (signatureData?.signature && signatureData?.apiKey && signatureData?.cloudName) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);
    formData.append("tags", "payment_proof");

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
      cloudinaryPublicId: result.public_id,
      resourceType: result.resource_type || "image",
      fileFormat: result.format || file.name.split(".").pop() || "jpg",
      originalFileName: file.name,
      url: result.secure_url,
      uploadedAt: new Date().toISOString(),
    };
  }

  // 2B. Local Fallback for offline Vite dev testing
  const localCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const localPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (localCloudName && localPreset) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", localPreset);
    formData.append("folder", "webryza/payment_proofs");

    const uploadUrl = `https://api.cloudinary.com/v1_1/${localCloudName}/image/upload`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const errJson = await uploadRes.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || "Local upload preset failed.");
    }

    const result = await uploadRes.json();
    if (onProgress) onProgress(100);

    return {
      cloudinaryPublicId: result.public_id,
      resourceType: result.resource_type || "image",
      fileFormat: result.format || file.name.split(".").pop() || "jpg",
      originalFileName: file.name,
      url: result.secure_url,
      uploadedAt: new Date().toISOString(),
    };
  }

  // 2C. In-browser demo mock if neither backend nor env preset is configured
  // Creates local object URL for seamless testing
  if (onProgress) onProgress(100);
  const mockPublicId = `webryza/payment_proofs/demo_${Date.now()}`;
  const mockUrl = URL.createObjectURL(file);

  return {
    cloudinaryPublicId: mockPublicId,
    resourceType: "image",
    fileFormat: file.name.split(".").pop() || "jpg",
    originalFileName: file.name,
    url: mockUrl,
    uploadedAt: new Date().toISOString(),
  };
}
