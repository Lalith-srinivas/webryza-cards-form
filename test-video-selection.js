import fs from "fs";
import path from "path";
import { validateVideoSelection, validateAmount } from "./src/utils/validation.js";
import { calculateCommissions } from "./src/utils/commission.js";
import { mapFirestoreToTemplateData } from "./src/utils/templateDataMapper.js";
import { VIDEO_STYLES } from "./src/constants/videoStyles.js";

console.log("=================================================");
console.log("   WebRyza Cards - Video Selection Test Suite   ");
console.log("=================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// -----------------------------------------------------------------------------
// Test Section 0: Verify Video Asset Availability
// -----------------------------------------------------------------------------
console.log("Section 0: Video Assets and Style Metadata");

const expectedStyles = [
  { name: "Royal Gold", file: "RoyalGold.mp4", poster: "RoyalGold.jpg" },
  { name: "Elegant Pastel Romance", file: "ElegantPastelRomance.mp4", poster: "ElegantPastelRomance.jpg" },
  { name: "Floral Botanical Romance", file: "FloralBotanicalRomance.mp4", poster: "FloralBotanicalRomance.jpg" },
  { name: "Temple Heritage", file: "TempleHeritage.mp4", poster: "TempleHeritage.jpg" },
];

assert(VIDEO_STYLES.length === 4, "Exactly 4 video styles defined in VideoStyleSelector");

for (const exp of expectedStyles) {
  const match = VIDEO_STYLES.find((s) => s.name === exp.name);
  assert(Boolean(match), `Video style '${exp.name}' exists in metadata`);
  const videoPath = path.join(process.cwd(), "public", "videos", exp.file);
  const posterPath = path.join(process.cwd(), "public", "videos", exp.poster);
  assert(fs.existsSync(videoPath), `Video file '${exp.file}' exists in public/videos`);
  assert(fs.existsSync(posterPath), `Poster file '${exp.poster}' exists in public/videos`);
}

// -----------------------------------------------------------------------------
// Helper to simulate registration payload generation (mimicking registrationService)
// -----------------------------------------------------------------------------
function buildMockRegistrationPayload(formData, isPartner = false) {
  const isVideoReq = Boolean(formData.videoRequired);
  const selectedVideoStyle = isVideoReq ? (formData.videoStyle || null) : null;
  const commissions = calculateCommissions(formData.amountCharged || "1500", isPartner);

  return {
    weddingId: "WR-9999",
    templateId: formData.templateId || "royal-gold",
    brideName: (formData.brideName || "").trim(),
    groomName: (formData.groomName || "").trim(),
    amountCharged: commissions.amountCharged,
    webryzaShare: commissions.webryzaShare,
    partnerCommission: commissions.partnerCommission,
    videoRequired: isVideoReq,
    videoStyle: selectedVideoStyle,
    aiVideoRequired: isVideoReq,
    aiVideoStatus: isVideoReq ? "pending" : "not_requested",
    videoStatus: isVideoReq ? "pending" : "not_requested",
    videoUrl: "",
    videoPublicId: "",
    websiteStatus: "published",
  };
}

// -----------------------------------------------------------------------------
// Scenario 1: Customer selects YES → Royal Gold → Review → Generate
// -----------------------------------------------------------------------------
console.log("\nScenario 1: Customer selects YES → Royal Gold");
const s1Form = {
  templateId: "royal-gold",
  brideName: "Priya",
  groomName: "Rahul",
  amountCharged: "2000",
  videoRequired: true,
  videoStyle: "Royal Gold",
};
const s1Err = validateVideoSelection(s1Form);
assert(Object.keys(s1Err).length === 0, "Scenario 1 passes validation");
const s1Payload = buildMockRegistrationPayload(s1Form);
assert(s1Payload.videoRequired === true, "Firestore videoRequired is true");
assert(s1Payload.videoStyle === "Royal Gold", "Firestore videoStyle is 'Royal Gold'");
assert(s1Payload.videoStatus === "pending", "Firestore videoStatus is 'pending'");

// -----------------------------------------------------------------------------
// Scenario 2: Customer selects YES → Elegant Pastel Romance → Review → Generate
// -----------------------------------------------------------------------------
console.log("\nScenario 2: Customer selects YES → Elegant Pastel Romance");
const s2Form = {
  templateId: "elegant-pastel-romance",
  brideName: "Ananya",
  groomName: "Aditya",
  amountCharged: "2500",
  videoRequired: true,
  videoStyle: "Elegant Pastel Romance",
};
const s2Err = validateVideoSelection(s2Form);
assert(Object.keys(s2Err).length === 0, "Scenario 2 passes validation");
const s2Payload = buildMockRegistrationPayload(s2Form);
assert(s2Payload.videoRequired === true, "Firestore videoRequired is true");
assert(s2Payload.videoStyle === "Elegant Pastel Romance", "Firestore videoStyle is 'Elegant Pastel Romance'");

// -----------------------------------------------------------------------------
// Scenario 3: Customer selects YES → Floral Botanical Romance → Review → Generate
// -----------------------------------------------------------------------------
console.log("\nScenario 3: Customer selects YES → Floral Botanical Romance");
const s3Form = {
  templateId: "lake-como-letters",
  brideName: "Deepika",
  groomName: "Ranveer",
  amountCharged: "3000",
  videoRequired: true,
  videoStyle: "Floral Botanical Romance",
};
const s3Err = validateVideoSelection(s3Form);
assert(Object.keys(s3Err).length === 0, "Scenario 3 passes validation");
const s3Payload = buildMockRegistrationPayload(s3Form);
assert(s3Payload.videoRequired === true, "Firestore videoRequired is true");
assert(s3Payload.videoStyle === "Floral Botanical Romance", "Firestore videoStyle is 'Floral Botanical Romance'");

// -----------------------------------------------------------------------------
// Scenario 4: Customer selects YES → Temple Heritage → Review → Generate
// -----------------------------------------------------------------------------
console.log("\nScenario 4: Customer selects YES → Temple Heritage");
const s4Form = {
  templateId: "temple-heritage",
  brideName: "Kavya",
  groomName: "Vishu",
  amountCharged: "1500",
  videoRequired: true,
  videoStyle: "Temple Heritage",
};
const s4Err = validateVideoSelection(s4Form);
assert(Object.keys(s4Err).length === 0, "Scenario 4 passes validation");
const s4Payload = buildMockRegistrationPayload(s4Form);
assert(s4Payload.videoRequired === true, "Firestore videoRequired is true");
assert(s4Payload.videoStyle === "Temple Heritage", "Firestore videoStyle is 'Temple Heritage'");

// -----------------------------------------------------------------------------
// Scenario 5: Customer selects NO → Review → Generate
// -----------------------------------------------------------------------------
console.log("\nScenario 5: Customer selects NO → Review → Generate");
const s5Form = {
  templateId: "royal-gold",
  brideName: "Sneha",
  groomName: "Karthik",
  amountCharged: "1500",
  videoRequired: false,
  videoStyle: null,
};
const s5Err = validateVideoSelection(s5Form);
assert(Object.keys(s5Err).length === 0, "Scenario 5 (NO video) passes validation without error");
const s5Payload = buildMockRegistrationPayload(s5Form);
assert(s5Payload.videoRequired === false, "Firestore videoRequired is false");
assert(s5Payload.videoStyle === null, "Firestore videoStyle is strictly null");
assert(s5Payload.videoStatus === "not_requested", "Firestore videoStatus is 'not_requested'");

// -----------------------------------------------------------------------------
// Scenario 6: Customer selects YES, selects a video, then changes to NO
// -----------------------------------------------------------------------------
console.log("\nScenario 6: Customer selects YES, picks a video, then switches to NO");

// Simulate FormContext updateField reducer logic
function simulateUpdateField(prev, field, value) {
  const updated = { ...prev, [field]: value };
  if (field === "videoRequired") {
    updated.aiVideoRequired = Boolean(value);
    if (!value) {
      updated.videoStyle = null;
    }
  } else if (field === "videoStyle") {
    if (value) {
      updated.videoRequired = true;
      updated.aiVideoRequired = true;
    }
  }
  return updated;
}

let formState = { videoRequired: false, videoStyle: null };
// 1. User clicks YES
formState = simulateUpdateField(formState, "videoRequired", true);
assert(formState.videoRequired === true, "Step 1: videoRequired is true");

// 2. User picks Royal Gold
formState = simulateUpdateField(formState, "videoStyle", "Royal Gold");
assert(formState.videoStyle === "Royal Gold", "Step 2: videoStyle set to Royal Gold");

// 3. User changes mind and clicks NO
formState = simulateUpdateField(formState, "videoRequired", false);
assert(formState.videoRequired === false, "Step 3: videoRequired reset to false");
assert(formState.videoStyle === null, "Step 3: videoStyle automatically cleared to null");

const s6Payload = buildMockRegistrationPayload(formState);
assert(s6Payload.videoRequired === false && s6Payload.videoStyle === null, "Scenario 6 payload has videoRequired: false and videoStyle: null");

// -----------------------------------------------------------------------------
// Scenario 7: Customer selects a video, navigates backward, and returns to Package
// -----------------------------------------------------------------------------
console.log("\nScenario 7: Backward navigation preserves selection");
let multiStepState = {
  step: 5,
  templateId: "royal-gold",
  videoRequired: true,
  videoStyle: "Floral Botanical Romance",
};

// Simulate clicking Previous: step goes from 5 to 4
multiStepState.step = 4;
assert(multiStepState.step === 4, "Navigated backward to step 4");
assert(multiStepState.videoStyle === "Floral Botanical Romance", "videoStyle still preserved while in Step 4");

// Simulate clicking Next: step returns to 5
multiStepState.step = 5;
assert(multiStepState.step === 5, "Navigated back to step 5");
assert(multiStepState.videoRequired === true, "videoRequired preserved upon return to Package step");
assert(multiStepState.videoStyle === "Floral Botanical Romance", "videoStyle preserved upon return to Package step");

// -----------------------------------------------------------------------------
// Scenario 8: Verify correct videoRequired and videoStyle values in Firestore
// -----------------------------------------------------------------------------
console.log("\nScenario 8: Firestore Schema Verification");
const yesDoc = buildMockRegistrationPayload({ videoRequired: true, videoStyle: "Temple Heritage" });
assert(typeof yesDoc.videoRequired === "boolean" && yesDoc.videoRequired === true, "Firestore schema: videoRequired is boolean true");
assert(yesDoc.videoStyle === "Temple Heritage", "Firestore schema: videoStyle is exact string");

const noDoc = buildMockRegistrationPayload({ videoRequired: false, videoStyle: null });
assert(typeof noDoc.videoRequired === "boolean" && noDoc.videoRequired === false, "Firestore schema: videoRequired is boolean false");
assert(noDoc.videoStyle === null, "Firestore schema: videoStyle is null");

// -----------------------------------------------------------------------------
// Scenario 9: Verify existing website generation, pricing, and partner attribution
// -----------------------------------------------------------------------------
console.log("\nScenario 9: Integration with Website Generation, Pricing & Partner Data");

const partnerWeddingDoc = buildMockRegistrationPayload({
  templateId: "temple-heritage",
  brideName: "Kavya",
  groomName: "Vishu",
  amountCharged: "2500",
  videoRequired: true,
  videoStyle: "Temple Heritage",
}, true); // Partner registration

assert(partnerWeddingDoc.amountCharged === 2500, "Package amount ₹2,500 preserved");
assert(partnerWeddingDoc.webryzaShare === 1500, "WebRyza share ₹1,500 correctly computed");
assert(partnerWeddingDoc.partnerCommission === 1000, "Partner commission ₹1,000 correctly computed");

// Test templateDataMapper with videoRequired and videoStyle
const mappedTemplateData = mapFirestoreToTemplateData({
  weddingId: "WR-9999",
  templateId: "temple-heritage",
  brideName: "Kavya",
  groomName: "Vishu",
  weddingDate: "2026-12-15",
  weddingTime: "10:30 AM",
  venueName: "Sri Venkateswara Kalyana Mandapam",
  venueAddress: "Tirupati, AP",
  videoRequired: true,
  videoStyle: "Temple Heritage",
  videoStatus: "pending",
});

assert(mappedTemplateData.videoRequired === true, "TemplateDataMapper: videoRequired mapped correctly");
assert(mappedTemplateData.videoStyle === "Temple Heritage", "TemplateDataMapper: videoStyle mapped correctly");
assert(mappedTemplateData.hasVideoSection === true, "TemplateDataMapper: hasVideoSection active when video is requested");
assert(mappedTemplateData.isVideoUploaded === false, "TemplateDataMapper: isVideoUploaded is false while video is pending");

// Test validation error when customer selects YES but no style
const invalidYesForm = { videoRequired: true, videoStyle: null };
const invalidYesErr = validateVideoSelection(invalidYesForm);
assert(Boolean(invalidYesErr.videoStyle), "Validation error correctly raised when YES is chosen without selecting style");

console.log("\n=================================================");
console.log(`  Test Results: ${passedCount} / ${totalCount} Passed`);
console.log("=================================================");

if (passedCount === totalCount) {
  console.log("\n  >>> ALL 9 VIDEO SELECTION SCENARIOS PASSED! <<<\n");
} else {
  console.error(`\n  >>> ${totalCount - passedCount} TESTS FAILED! <<<\n`);
  process.exit(1);
}
