import { calculateCommissions, MINIMUM_REGISTRATION_AMOUNT } from "./src/utils/commission.js";
import {
  isValidPhone,
  isValidEmail,
  isValidUrl,
  validateCoupleDetails,
  validateWeddingDetails,
  validateEvent,
  validateAmount,
} from "./src/utils/validation.js";

console.log("=================================================");
console.log("  WebRyza Cards Form - Comprehensive Test Suite  ");
console.log("=================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// ----------------------------------------------------------------------
// 1. Commission Business Rules Verification
// ----------------------------------------------------------------------
console.log("Scenario A: Commission Rules Verification");

// Amount ₹1,500
const comm1500Partner = calculateCommissions(1500, true);
assert(comm1500Partner.webryzaShare === 1000, "₹1,500 with partner -> WebRyza share is ₹1,000");
assert(comm1500Partner.partnerCommission === 500, "₹1,500 with partner -> Partner commission is ₹500");
assert(comm1500Partner.amountDueToWebryza === 1000, "₹1,500 with partner -> Amount due to WebRyza is ₹1,000");

const comm1500Direct = calculateCommissions(1500, false);
assert(comm1500Direct.webryzaShare === 1000, "₹1,500 direct -> WebRyza share is ₹1,000");
assert(comm1500Direct.partnerCommission === 0, "₹1,500 direct -> Partner commission is ₹0");

// Amount ₹1,800
const comm1800Partner = calculateCommissions(1800, true);
assert(comm1800Partner.webryzaShare === 1000, "₹1,800 with partner -> WebRyza share is ₹1,000");
assert(comm1800Partner.partnerCommission === 800, "₹1,800 with partner -> Partner commission is ₹800");

// Amount ₹2,000
const comm2000Partner = calculateCommissions(2000, true);
assert(comm2000Partner.webryzaShare === 1500, "₹2,000 with partner -> WebRyza share is ₹1,500");
assert(comm2000Partner.partnerCommission === 500, "₹2,000 with partner -> Partner commission is ₹500");

// Amount ₹2,500
const comm2500Partner = calculateCommissions(2500, true);
assert(comm2500Partner.webryzaShare === 1500, "₹2,500 with partner -> WebRyza share is ₹1,500");
assert(comm2500Partner.partnerCommission === 1000, "₹2,500 with partner -> Partner commission is ₹1,000");

// Amount ₹3,000
const comm3000Partner = calculateCommissions(3000, true);
assert(comm3000Partner.webryzaShare === 1500, "₹3,000 with partner -> WebRyza share is ₹1,500");
assert(comm3000Partner.partnerCommission === 1500, "₹3,000 with partner -> Partner commission is ₹1,500");

// Amount below ₹1,500
let rejectedBelow1500 = false;
try {
  calculateCommissions(1400, true);
} catch (e) {
  rejectedBelow1500 = true;
}
assert(rejectedBelow1500, "Amount below ₹1,500 is correctly rejected with validation error");

console.log("\nScenario B: Field Validations");

// Phone number validation
assert(isValidPhone("9876543210"), "Valid 10-digit phone 9876543210 accepted");
assert(isValidPhone("+91 98765 43210"), "Valid phone with +91 accepted");
assert(!isValidPhone("12345"), "Invalid short phone number rejected");
assert(!isValidPhone("abcdefghij"), "Non-numeric phone rejected");

// Email validation
assert(isValidEmail(""), "Empty email accepted (optional)");
assert(isValidEmail("priya@example.com"), "Valid email accepted");
assert(!isValidEmail("invalid-email"), "Malformed email rejected");

// URL validation
assert(isValidUrl(""), "Empty URL accepted (optional)");
assert(isValidUrl("https://maps.google.com/?q=Tirupati"), "Valid Google Maps URL accepted");
assert(!isValidUrl("not-a-url"), "Malformed URL rejected");

// Required fields validation
const emptyCouple = validateCoupleDetails({});
assert(Object.keys(emptyCouple).length >= 5, "Missing couple required fields correctly detected");

const validCouple = validateCoupleDetails({
  brideName: "Priya",
  groomName: "Rahul",
  brideParents: "Srinivas and Lakshmi",
  groomParents: "Ramesh and Sita",
  phone: "9876543210",
  email: "priya@example.com",
});
assert(Object.keys(validCouple).length === 0, "Complete couple details produce no errors");

// Wedding details validation
const emptyWedding = validateWeddingDetails({});
assert(emptyWedding.venueLocation === undefined, "venueLocation (Google Maps link) is optional when empty");
assert(emptyWedding.weddingDate !== undefined, "Missing weddingDate correctly flagged as required");

const invalidUrlWedding = validateWeddingDetails({
  weddingDate: "2026-12-14",
  weddingTime: "10:30 AM",
  venueName: "Sri Venkateswara Kalyana Mandapam",
  venueAddress: "Tirupati, AP",
  venueLocation: "not-a-valid-url",
});
assert(invalidUrlWedding.venueLocation !== undefined, "Invalid venueLocation URL correctly flagged");

const validWeddingNoLink = validateWeddingDetails({
  weddingDate: "2026-12-14",
  weddingTime: "10:30 AM",
  venueName: "Sri Venkateswara Kalyana Mandapam",
  venueAddress: "Tirupati, AP",
});
assert(Object.keys(validWeddingNoLink).length === 0, "Valid wedding details without Google Maps link produce no errors (optional)");

const validWedding = validateWeddingDetails({
  weddingDate: "2026-12-14",
  weddingTime: "10:30 AM",
  venueName: "Sri Venkateswara Kalyana Mandapam",
  venueAddress: "Tirupati, AP",
  venueLocation: "https://maps.google.com/?q=Tirupati",
});
assert(Object.keys(validWedding).length === 0, "Valid wedding details with Google Maps link produce no errors");

// Event validation
const validEvent = validateEvent({
  eventName: "Haldi",
  date: "2026-12-13",
  venueName: "Bride's Residence",
  venueAddress: "Tirupati",
});
assert(Object.keys(validEvent).length === 0, "Valid event produces no errors");

const invalidEvent = validateEvent({
  eventName: "",
  date: "",
});
assert(Object.keys(invalidEvent).length >= 3, "Incomplete event correctly flags missing fields");

console.log("\nScenario C: Partner Attributions");

function simulatePartnerResolution(ref, partnerDb) {
  if (!ref || !ref.trim()) {
    return { source: "direct", partnerId: "", partnerShopName: "Direct" };
  }
  const partner = partnerDb[ref.trim()];
  if (partner && partner.isActive) {
    return { source: "partner", partnerId: ref.trim(), partnerShopName: partner.shopName };
  }
  return { source: "direct", partnerId: "", partnerShopName: "Direct", status: partner ? "inactive" : "not_found" };
}

const mockPartners = {
  SHOP001: { shopName: "Sri Lakshmi Wedding Cards", isActive: true },
  SHOP002: { shopName: "Balaji Royal Printers", isActive: true },
  SHOP_INACTIVE: { shopName: "Old Cards Center", isActive: false },
};

const directRes = simulatePartnerResolution("", mockPartners);
assert(directRes.source === "direct" && directRes.partnerId === "" && directRes.partnerShopName === "Direct", "Direct registration (no ref) correctly formatted");

const shop001Res = simulatePartnerResolution("SHOP001", mockPartners);
assert(shop001Res.source === "partner" && shop001Res.partnerId === "SHOP001" && shop001Res.partnerShopName === "Sri Lakshmi Wedding Cards", "SHOP001 resolves to active partner");

const shop002Res = simulatePartnerResolution("SHOP002", mockPartners);
assert(shop002Res.source === "partner" && shop002Res.partnerId === "SHOP002" && shop002Res.partnerShopName === "Balaji Royal Printers", "SHOP002 resolves to second active partner");

const invalidRefRes = simulatePartnerResolution("INVALID_REF", mockPartners);
assert(invalidRefRes.source === "direct" && invalidRefRes.partnerId === "", "Invalid ref safely falls back to direct");

const inactiveRefRes = simulatePartnerResolution("SHOP_INACTIVE", mockPartners);
assert(inactiveRefRes.source === "direct" && inactiveRefRes.partnerId === "" && inactiveRefRes.status === "inactive", "Inactive partner safely blocked from attribution");

console.log("\n=================================================");
console.log(`  Test Results: ${passedCount} / ${totalCount} Passed`);
console.log("=================================================\n");

if (passedCount === totalCount) {
  console.log("All business rules and verification scenarios passed successfully!");
} else {
  process.exit(1);
}
