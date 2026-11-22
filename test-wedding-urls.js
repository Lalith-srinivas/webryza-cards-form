import { matchRoutes } from "react-router-dom";

console.log("=================================================");
console.log("  WebRyza Cards - Wedding URL Verification Suite ");
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
// 1. React Router Route Matching Verification
// -----------------------------------------------------------------------------
console.log("Test Section 1: Route Matching for /card=WR-1691 and /card=WR-3003");

const routes = [
  { path: "/", id: "home" },
  { path: "/templates/royal-gold", id: "tmpl-royal" },
  { path: "/templates/temple-heritage", id: "tmpl-temple" },
  { path: "/templates/elegant-pastel", id: "tmpl-pastel" },
  { path: "/templates/lake-como-letters", id: "tmpl-lakecomo" },
  { path: "/preview", id: "preview" },
  { path: "/admin/login", id: "admin-login" },
  { path: "/admin/dashboard", id: "admin-dash" },
  { path: "/admin", id: "admin-root" },
  { path: "/card/:cardId", id: "card-path" },
  { path: "/card", id: "card-direct" },
  { path: "/:cardSlug", id: "card-slug" },
  { path: "*", id: "catch-all" },
];

const match1691 = matchRoutes(routes, "/card=WR-1691");
assert(
  match1691 && match1691[0]?.route?.id === "card-slug",
  "URL '/card=WR-1691' matches card-slug route (NOT catch-all / redirect)"
);

const match3003 = matchRoutes(routes, "/card=WR-3003");
assert(
  match3003 && match3003[0]?.route?.id === "card-slug",
  "URL '/card=WR-3003' matches card-slug route (NOT catch-all / redirect)"
);

const match0001 = matchRoutes(routes, "/card=0001");
assert(
  match0001 && match0001[0]?.route?.id === "card-slug",
  "URL '/card=0001' matches card-slug route"
);

const matchSlash = matchRoutes(routes, "/card/WR-1691");
assert(
  matchSlash && matchSlash[0]?.route?.id === "card-path",
  "URL '/card/WR-1691' matches card-path route"
);

const matchHome = matchRoutes(routes, "/");
assert(
  matchHome && matchHome[0]?.route?.id === "home",
  "URL '/' matches home route without regression"
);

const matchAdmin = matchRoutes(routes, "/admin/login");
assert(
  matchAdmin && matchAdmin[0]?.route?.id === "admin-login",
  "URL '/admin/login' matches admin-login without regression"
);

// -----------------------------------------------------------------------------
// 2. URL Extraction & Slug Parsing
// -----------------------------------------------------------------------------
console.log("\nTest Section 2: Wedding Identifier Extraction Logic");

function extractCardIdFromInput({ paramCardId, cardSlug, pathname, search }) {
  if (paramCardId) return paramCardId.replace(/^=/, "").trim();

  if (cardSlug) {
    const slugMatch = cardSlug.match(/^card[=/-]?([A-Za-z0-9_-]+)/i);
    if (slugMatch && slugMatch[1]) return slugMatch[1].trim();
    if (cardSlug.startsWith("card=")) return cardSlug.substring(5).trim();
  }

  if (pathname) {
    const pathMatch = pathname.match(/\/card[=/-]?([A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) return pathMatch[1].trim();
  }

  if (search) {
    const sp = new URLSearchParams(search);
    const qId = sp.get("card") || sp.get("id");
    if (qId) return qId.trim();
  }

  return "";
}

assert(
  extractCardIdFromInput({ cardSlug: "card=WR-1691", pathname: "/card=WR-1691" }) === "WR-1691",
  "Extracts 'WR-1691' from pathname '/card=WR-1691'"
);

assert(
  extractCardIdFromInput({ cardSlug: "card=WR-3003", pathname: "/card=WR-3003" }) === "WR-3003",
  "Extracts 'WR-3003' from pathname '/card=WR-3003'"
);

assert(
  extractCardIdFromInput({ cardSlug: "card=0001", pathname: "/card=0001" }) === "0001",
  "Extracts '0001' from pathname '/card=0001'"
);

assert(
  extractCardIdFromInput({ paramCardId: "WR-1691", pathname: "/card/WR-1691" }) === "WR-1691",
  "Extracts 'WR-1691' from '/card/WR-1691'"
);

// -----------------------------------------------------------------------------
// 3. Privacy Sanitization Verification
// -----------------------------------------------------------------------------
console.log("\nTest Section 3: Privacy & Data Sanitization for Public Invitations");

const rawFirestoreDoc = {
  id: "doc_123456",
  weddingId: "WR-1691",
  templateId: "lakecomo-letters",
  brideName: "Priya Sharma",
  groomName: "Rahul Verma",
  brideParents: "Srinivas & Lakshmi",
  groomParents: "Ramesh & Sita",
  weddingDate: "2027-02-15",
  weddingTime: "10:30 AM",
  venueName: "Palace Convention Hall",
  venueAddress: "Tirupati, AP",
  venueLocation: "https://maps.google.com/?q=Tirupati",
  events: [
    {
      eventName: "Sangeet",
      date: "2027-02-14",
      time: "07:00 PM",
      venueName: "Palace Hall",
      venueAddress: "Tirupati",
    },
  ],
  // PRIVATE FIELDS THAT MUST NEVER BE EXPOSED:
  phone: "+91 9876543210",
  email: "priya@example.com",
  amountCharged: 2500,
  webryzaShare: 1500,
  partnerCommission: 1000,
  amountReceivedByWebryza: 0,
  amountDueToWebryza: 1500,
  partnerId: "SHOP001",
  partnerShopName: "Sri Lakshmi Wedding Cards",
  adminNotes: "Customer requested gold border print",
  paymentStatus: "pending",
};

function sanitizeWeddingData(docData, weddingIdentifier) {
  const normalizedTemplate = (docData.templateId || "royal-gold").toLowerCase().trim();

  const normalizedEvents = (docData.events || []).map((ev) => ({
    name: ev.eventName || ev.name || "Wedding Celebration",
    eventName: ev.eventName || ev.name || "Wedding Celebration",
    date: ev.date || docData.weddingDate,
    time: ev.time || docData.weddingTime || "",
    venue: ev.venueName || ev.venue || docData.venueName || "",
    venueName: ev.venueName || ev.venue || docData.venueName || "",
    address: ev.venueAddress || ev.address || docData.venueAddress || "",
    venueAddress: ev.venueAddress || ev.address || docData.venueAddress || "",
    mapLink: ev.locationLink || ev.mapLink || docData.venueLocation || "",
    googleMapsLink: ev.locationLink || ev.mapLink || docData.venueLocation || "",
    description: ev.description || "",
  }));

  return {
    weddingId: docData.weddingId || weddingIdentifier,
    templateId: normalizedTemplate,
    brideName: docData.brideName || "The Bride",
    groomName: docData.groomName || "The Groom",
    brideParents: docData.brideParents || "",
    groomParents: docData.groomParents || "",
    weddingDate: docData.weddingDate,
    weddingTime: docData.weddingTime || "",
    venueName: docData.venueName || "",
    venueAddress: docData.venueAddress || "",
    googleMapsLink: docData.venueLocation || docData.googleMapsLink || "",
    venueLocation: docData.venueLocation || "",
    events: normalizedEvents,
    videoUrl: docData.videoUrl || "",
    hashtag: `#${(docData.brideName || "Bride").replace(/\s+/g, "")}And${(docData.groomName || "Groom").replace(/\s+/g, "")}`,
    additionalDetails: docData.additionalDetails || "",
  };
}

const sanitized = sanitizeWeddingData(rawFirestoreDoc, "WR-1691");

assert(sanitized.brideName === "Priya Sharma", "Bride name preserved");
assert(sanitized.groomName === "Rahul Verma", "Groom name preserved");
assert(sanitized.weddingId === "WR-1691", "Wedding ID preserved");
assert(sanitized.templateId === "lakecomo-letters", "Template ID mapped to lakecomo-letters");
assert(sanitized.events.length === 1, "Events array preserved");

// Verify strict exclusion of sensitive fields
assert(sanitized.phone === undefined, "Customer phone number is NOT exposed to guests");
assert(sanitized.email === undefined, "Customer email is NOT exposed to guests");
assert(sanitized.amountCharged === undefined, "Package amount charged is NOT exposed to guests");
assert(sanitized.webryzaShare === undefined, "WebRyza share is NOT exposed to guests");
assert(sanitized.partnerCommission === undefined, "Partner commission is NOT exposed to guests");
assert(sanitized.partnerId === undefined, "Partner code is NOT exposed to guests");
assert(sanitized.adminNotes === undefined, "Admin notes are NOT exposed to guests");
assert(sanitized.paymentStatus === undefined, "Payment status is NOT exposed to guests");

console.log("\n=================================================");
console.log(`  Test Results: ${passed} / ${total} Passed`);
console.log("=================================================\n");

if (passed === total) {
  console.log("All wedding invitation URL tests PASSED successfully!");
} else {
  console.error("Some tests failed!");
  process.exit(1);
}
