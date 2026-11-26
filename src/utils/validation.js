/**
 * Validation utilities for WebRyza Cards Form
 */

export function isValidPhone(phone) {
  if (!phone) return false;
  // Match standard 10-digit Indian phone number, allowing optional +91, 0 prefix, spaces, or dashes
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  // Cleaned should be 10 digits, or 12 digits starting with 91, or 11 starting with 0
  if (/^[6-9]\d{9}$/.test(cleaned)) return true;
  if (/^91[6-9]\d{9}$/.test(cleaned)) return true;
  if (/^0[6-9]\d{9}$/.test(cleaned)) return true;
  return false;
}

export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function isValidEmail(email) {
  if (!email || email.trim() === '') return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidUrl(url) {
  if (!url || url.trim() === '') return true; // Optional field
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateCoupleDetails(data) {
  const errors = {};
  if (!data.brideName || !data.brideName.trim()) {
    errors.brideName = "Bride's Name is required";
  }
  if (!data.groomName || !data.groomName.trim()) {
    errors.groomName = "Groom's Name is required";
  }
  if (!data.brideParents || !data.brideParents.trim()) {
    errors.brideParents = "Bride's Parents' Names are required";
  }
  if (!data.groomParents || !data.groomParents.trim()) {
    errors.groomParents = "Groom's Parents' Names are required";
  }
  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Contact Phone Number is required";
  } else if (!isValidPhone(data.phone)) {
    errors.phone = "Please enter a valid 10-digit mobile number";
  }
  if (data.email && data.email.trim() && !isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  return errors;
}

export function validateWeddingDetails(data) {
  const errors = {};
  if (!data.weddingDate) {
    errors.weddingDate = "Wedding Date is required";
  }
  if (!data.weddingTime || !data.weddingTime.trim()) {
    errors.weddingTime = "Wedding Time is required (e.g., 10:30 AM)";
  }
  if (!data.venueName || !data.venueName.trim()) {
    errors.venueName = "Venue Name is required";
  }
  if (!data.venueAddress || !data.venueAddress.trim()) {
    errors.venueAddress = "Venue Address is required";
  }
  if (data.venueLocation && data.venueLocation.trim() && !isValidUrl(data.venueLocation)) {
    errors.venueLocation = "Please enter a valid Google Maps link (e.g. https://maps.google.com/...)";
  }
  return errors;
}

export function validateEvent(event) {
  const errors = {};
  if (!event.eventName || !event.eventName.trim()) {
    errors.eventName = "Event Name is required";
  }
  if (!event.date) {
    errors.date = "Event Date is required";
  }
  if (!event.venueName || !event.venueName.trim()) {
    errors.venueName = "Venue Name is required";
  }
  if (!event.venueAddress || !event.venueAddress.trim()) {
    errors.venueAddress = "Venue Address is required";
  }
  if (event.locationLink && event.locationLink.trim() && !isValidUrl(event.locationLink)) {
    errors.locationLink = "Please enter a valid Google Maps URL";
  }
  return errors;
}

export function validateAmount(amount) {
  const num = Number(amount);
  if (amount === '' || isNaN(num)) {
    return "Please enter the total amount charged";
  }
  if (num < 1500) {
    return "Minimum amount must be at least ₹1,500";
  }
  return null;
}

/**
 * Template-specific photo validation according to exact business rules:
 * - Royal Gold: 1 to 6 gallery images (mandatory: at least 1)
 * - Temple Heritage: exactly 1 couple image (mandatory)
 * - Elegant Pastel Romance: couple (hero), bride, groom, and 1 to 8 gallery images (all mandatory)
 * - Lakecomo Letters: 1 to 7 gallery images (mandatory: at least 1)
 */
export function validateTemplatePhotos(data) {
  const errors = {};
  const rawTmpl = (data.templateId || "royal-gold").toLowerCase().trim();

  const isTemple = rawTmpl.includes("temple") || rawTmpl.includes("vishu") || rawTmpl.includes("heritage");
  const isPastel = rawTmpl.includes("pastel") || rawTmpl.includes("romance");
  const isLakecomo = rawTmpl.includes("lake") || rawTmpl.includes("letters") || rawTmpl.includes("como") || rawTmpl.includes("floral") || rawTmpl.includes("botanical") || rawTmpl.includes("bloom");
  const isRoyal = !isTemple && !isPastel && !isLakecomo;

  const galleryList = Array.isArray(data.images?.gallery)
    ? data.images.gallery
    : Array.isArray(data.galleryImages)
    ? data.galleryImages
    : [];

  const couplePhoto = (data.images?.couple || data.couplePhotoUrl || "").trim();
  const bridePhoto = (data.images?.bride || data.bridePhotoUrl || "").trim();
  const groomPhoto = (data.images?.groom || data.groomPhotoUrl || "").trim();

  if (isRoyal) {
    if (galleryList.length === 0) {
      errors.galleryImages = "Royal Gold requires at least 1 gallery photo (up to 6 photos).";
    } else if (galleryList.length > 6) {
      errors.galleryImages = "Maximum 6 gallery photos allowed for Royal Gold.";
    }
  } else if (isTemple) {
    if (!couplePhoto) {
      errors.couplePhotoUrl = "Couple photograph is required for Temple Heritage.";
    }
  } else if (isPastel) {
    if (!couplePhoto) {
      errors.couplePhotoUrl = "Couple cover photograph is required for Elegant Pastel Romance.";
    }
    if (!bridePhoto) {
      errors.bridePhotoUrl = "Bride's photograph is required for Elegant Pastel Romance.";
    }
    if (!groomPhoto) {
      errors.groomPhotoUrl = "Groom's photograph is required for Elegant Pastel Romance.";
    }
    if (galleryList.length === 0) {
      errors.galleryImages = "Elegant Pastel Romance requires at least 1 gallery photo (up to 8 photos).";
    } else if (galleryList.length > 8) {
      errors.galleryImages = "Maximum 8 gallery photos allowed for Elegant Pastel Romance.";
    }
  } else if (isLakecomo) {
    if (galleryList.length === 0) {
      errors.galleryImages = "Floral Botanical Romance requires at least 1 gallery photo (up to 7 photos).";
    } else if (galleryList.length > 7) {
      errors.galleryImages = "Maximum 7 gallery photos allowed for Floral Botanical Romance.";
    }
  }

  return errors;
}
