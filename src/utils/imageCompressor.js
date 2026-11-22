/**
 * Client-Side Image Compressor & Validator
 * 
 * Compresses and resizes high-resolution wedding photos directly on the user's device
 * using HTML5 Canvas before uploading to Cloudinary.
 * 
 * - Max dimension: 1600px width/height (preserving aspect ratio)
 * - Compression quality: 0.82 JPEG (drops file size from ~10MB to ~250-400KB)
 * - Restricts formats to JPEG, PNG, WebP
 * - Restricts max original file size to 10MB
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates file type and size
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Unsupported file format. Please upload JPG, PNG, or WebP images.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "File is too large. Maximum allowed size is 10 MB.",
    };
  }

  return { valid: true };
}

/**
 * Compresses an image file on the client using HTML5 Canvas
 * @param {File} file - Original image file
 * @param {Object} options - { maxWidth: 1600, maxHeight: 1600, quality: 0.82 }
 * @returns {Promise<File>} Compressed File
 */
export async function compressImage(file, options = {}) {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = options;

  // Validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // If already under 250KB and a standard JPEG, skip heavy re-compression
  if (file.size <= 250 * 1024 && file.type === "image/jpeg") {
    return file;
  }

  // Check if browser supports HTML5 Canvas
  if (typeof window === "undefined" || !window.document || !window.document.createElement) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate constrained dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Draw onto offscreen canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return resolve(file); // Fallback to original
      }

      // Fill background white in case of transparent PNG converted to JPEG
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          // Create new File with clean name
          const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          const compressedFile = new File([blob], cleanName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to process image. The file may be corrupt."));
    };

    img.src = objectUrl;
  });
}
