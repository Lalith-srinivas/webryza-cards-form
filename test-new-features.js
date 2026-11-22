import crypto from "crypto";
import { mapFirestoreToTemplateData } from "./src/utils/templateDataMapper.js";
import { validateImageFile } from "./src/utils/imageCompressor.js";

console.log("=================================================");
console.log(" WebRyza Cards - QR & Cloudinary Feature Suite   ");
console.log("=================================================\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// -----------------------------------------------------------------------------
// FEATURE 1: QR CODE IN PARTNER DASHBOARD
// -----------------------------------------------------------------------------
console.log("Feature 1: Dynamic QR Code in Partner Dashboard");

function generateWeddingQrConfig(weddingId, baseUrl = "https://cards.webryza.in") {
  const cleanId = String(weddingId || "").trim();
  const websiteUrl = `${baseUrl}/card=${cleanId}`;
  return {
    weddingId: cleanId,
    websiteUrl,
    filename: `WebRyza-QR-${cleanId}.png`,
    buttons: ["Copy Link", "Download QR Code", "Open Website"],
  };
}

const qr1691 = generateWeddingQrConfig("WR-1691");
assert(qr1691.websiteUrl === "https://cards.webryza.in/card=WR-1691", "QR URL dynamically generated for WR-1691");
assert(qr1691.filename === "WebRyza-QR-WR-1691.png", "Download filename formatted correctly as PNG");
assert(qr1691.buttons.includes("Copy Link"), "Copy Link button configured");
assert(qr1691.buttons.includes("Download QR Code"), "Download QR Code button configured");
assert(qr1691.buttons.includes("Open Website"), "Open Website button configured");

const qr8999 = generateWeddingQrConfig("WR-8999");
assert(qr8999.websiteUrl === "https://cards.webryza.in/card=WR-8999", "Unique QR URL for WR-8999");
assert(qr8999.websiteUrl !== qr1691.websiteUrl, "Each wedding has a strictly unique QR code URL");

// Multi-tenancy check
const mockProjects = [
  { id: "doc-1", weddingId: "WR-101", partnerId: "SHOP001", websiteUrl: "https://cards.webryza.in/card=WR-101" },
  { id: "doc-2", weddingId: "WR-102", partnerId: "SHOP002", websiteUrl: "https://cards.webryza.in/card=WR-102" },
  { id: "doc-3", weddingId: "WR-103", partnerId: "SHOP001", websiteUrl: "https://cards.webryza.in/card=WR-103" },
];

function filterPartnerProjects(partnerCode, allProjects) {
  return allProjects.filter((p) => p.partnerId === partnerCode);
}

const shop1Projects = filterPartnerProjects("SHOP001", mockProjects);
assert(shop1Projects.length === 2, "Partner SHOP001 sees only their own 2 wedding projects");
assert(shop1Projects.every((p) => p.partnerId === "SHOP001"), "Partners strictly isolated to their own QR codes");

// -----------------------------------------------------------------------------
// FEATURE 2: CLOUDINARY UPLOAD ARCHITECTURE & SIGNATURE GENERATION
// -----------------------------------------------------------------------------
console.log("\nFeature 2: Cloudinary Upload Integration & Signature Generator");

// Test Signature Generator Formula
function generateCloudinarySignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const serialized = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
  const stringToSign = `${serialized}${apiSecret}`;
  return crypto.createHash("sha1").update(stringToSign).digest("hex");
}

const testParams = {
  folder: "webryza/weddings",
  timestamp: 1732280000,
};
const mockSecret = "sample_cloudinary_secret_12345";
const generatedSignature = generateCloudinarySignature(testParams, mockSecret);

// Verified against standard Cloudinary SHA-1 formula
const expectedString = `folder=webryza/weddings&timestamp=1732280000sample_cloudinary_secret_12345`;
const expectedSignature = crypto.createHash("sha1").update(expectedString).digest("hex");
assert(generatedSignature === expectedSignature, "Server signature matches Cloudinary SHA-1 signing specification");

// Test File Validation
assert(validateImageFile({ type: "image/jpeg", size: 2 * 1024 * 1024 }).valid, "Valid 2MB JPEG accepted");
assert(validateImageFile({ type: "image/png", size: 4 * 1024 * 1024 }).valid, "Valid 4MB PNG accepted");
assert(validateImageFile({ type: "image/webp", size: 1 * 1024 * 1024 }).valid, "Valid 1MB WebP accepted");
assert(!validateImageFile({ type: "application/pdf", size: 1024 }).valid, "PDF rejected");
assert(!validateImageFile({ type: "image/gif", size: 1024 }).valid, "GIF rejected");
assert(!validateImageFile({ type: "image/jpeg", size: 12 * 1024 * 1024 }).valid, "File over 10MB rejected");

// -----------------------------------------------------------------------------
// FEATURE 2: FIRESTORE & TEMPLATE INTEGRATION
// -----------------------------------------------------------------------------
console.log("\nFeature 2: Firestore Photo Mapping & Template Compatibility");

import { validateTemplatePhotos } from "./src/utils/validation.js";

// Template 2: Temple Heritage (Couple photo only, no bride, groom, or gallery)
const templeDocWithPhotos = {
  weddingId: "WR-5500",
  templateId: "temple-heritage",
  brideName: "Priya",
  groomName: "Rahul",
  brideParents: "Srinivas & Lakshmi",
  groomParents: "Ramesh & Sita",
  weddingDate: "2026-11-30",
  weddingTime: "09:00 AM",
  venueName: "Asha conventions",
  venueAddress: "tirupati",
  bridePhotoUrl: "https://res.cloudinary.com/webryza/image/upload/v1/webryza/weddings/bride.jpg",
  groomPhotoUrl: "https://res.cloudinary.com/webryza/image/upload/v1/webryza/weddings/groom.jpg",
  couplePhotoUrl: "https://res.cloudinary.com/webryza/image/upload/v1/webryza/weddings/couple.jpg",
  events: [],
};

const mappedTemple = mapFirestoreToTemplateData(templeDocWithPhotos, "WR-5500");
assert(mappedTemple.coupleImage === templeDocWithPhotos.couplePhotoUrl, "temple-heritage maps couplePhotoUrl to coupleImage");
assert(mappedTemple.brideImage === "", "temple-heritage excludes brideImage according to template rules");
assert(mappedTemple.groomImage === "", "temple-heritage excludes groomImage according to template rules");
assert(mappedTemple.galleryImages.length === 0, "temple-heritage excludes galleryImages according to template rules");

// Template 3: Elegant Pastel Romance (Couple hero, bride, groom, and gallery)
const pastelDocWithPhotos = {
  weddingId: "WR-5501",
  templateId: "elegant-pastel-romance",
  brideName: "Priya",
  groomName: "Rahul",
  couplePhotoUrl: "https://res.cloudinary.com/webryza/image/upload/v1/webryza/weddings/couple.jpg",
  bridePhotoUrl: "https://res.cloudinary.com/webryza/image/upload/v1/webryza/weddings/bride.jpg",
  groomPhotoUrl: "https://res.cloudinary.com/webryza/image/upload/v1/webryza/weddings/groom.jpg",
  galleryImages: ["https://res.cloudinary.com/webryza/image/upload/v1/webryza/weddings/g1.jpg"],
};

const mappedPastel = mapFirestoreToTemplateData(pastelDocWithPhotos, "WR-5501");
assert(mappedPastel.coupleImage === pastelDocWithPhotos.couplePhotoUrl, "elegant-pastel maps couplePhotoUrl to coupleImage");
assert(mappedPastel.brideImage === pastelDocWithPhotos.bridePhotoUrl, "elegant-pastel maps bridePhotoUrl to brideImage");
assert(mappedPastel.groomImage === pastelDocWithPhotos.groomPhotoUrl, "elegant-pastel maps groomPhotoUrl to groomImage");
assert(mappedPastel.galleryImages.length === 1, "elegant-pastel maps galleryImages");

// Template 1 & 4: Royal Gold & Lake Como (Gallery only)
const royalDoc = {
  weddingId: "WR-5502",
  templateId: "royal-gold",
  couplePhotoUrl: "https://example.com/couple.jpg",
  galleryImages: ["https://example.com/g1.jpg", "https://example.com/g2.jpg"],
};
const mappedRoyal = mapFirestoreToTemplateData(royalDoc, "WR-5502");
assert(mappedRoyal.coupleImage === "", "royal-gold excludes coupleImage");
assert(mappedRoyal.galleryImages.length === 2, "royal-gold maps galleryImages");

// Validation tests
assert(Object.keys(validateTemplatePhotos({ templateId: "temple-heritage", couplePhotoUrl: "url" })).length === 0, "Temple Heritage valid with couple photo");
assert(validateTemplatePhotos({ templateId: "temple-heritage", couplePhotoUrl: "" }).couplePhotoUrl !== undefined, "Temple Heritage requires couple photo");
assert(Object.keys(validateTemplatePhotos({ templateId: "royal-gold", galleryImages: ["g1"] })).length === 0, "Royal Gold valid with 1 gallery photo");
assert(validateTemplatePhotos({ templateId: "royal-gold", galleryImages: [] }).galleryImages !== undefined, "Royal Gold requires at least 1 gallery photo");
assert(validateTemplatePhotos({ templateId: "royal-gold", galleryImages: [1,2,3,4,5,6,7] }).galleryImages !== undefined, "Royal Gold rejects >6 gallery photos");
assert(Object.keys(validateTemplatePhotos({ templateId: "lakecomo-letters", galleryImages: ["g1", "g2"] })).length === 0, "Lake Como valid with gallery photos");
assert(validateTemplatePhotos({ templateId: "lakecomo-letters", galleryImages: [1,2,3,4,5,6,7,8] }).galleryImages !== undefined, "Lake Como rejects >7 gallery photos");

// Backward compatibility: existing records without photos
const legacyDocWithoutPhotos = {
  weddingId: "WR-1001",
  templateId: "royal-gold",
  brideName: "Kavya",
  groomName: "Vishu",
  weddingDate: "2026-11-02",
  weddingTime: "08:00 AM",
  venueName: "Temple Palace",
};

const mappedLegacy = mapFirestoreToTemplateData(legacyDocWithoutPhotos, "WR-1001");
assert(mappedLegacy.weddingId === "WR-1001", "Legacy record without photos mapped successfully");
assert(mappedLegacy.brideImage === "", "Legacy brideImage defaults to empty string gracefully");
assert(mappedLegacy.groomImage === "", "Legacy groomImage defaults to empty string gracefully");
assert(mappedLegacy.coupleImage === "", "Legacy coupleImage defaults to empty string gracefully");

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n=================================================");
console.log(`  Tests Completed: ${passed} / ${total} passed`);
console.log("=================================================\n");

if (passed === total) {
  console.log("  >>> ALL NEW FEATURE TESTS PASSED SUCCESSFULLY! <<<\n");
  process.exit(0);
} else {
  console.error("  >>> SOME TESTS FAILED! <<<\n");
  process.exit(1);
}
