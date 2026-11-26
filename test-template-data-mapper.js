import {
  mapFirestoreToTemplateData,
  normalizeDate,
  formatDatePretty,
  normalizeParents,
  determineEventIcon,
  normalizeTemplateId,
} from "./src/utils/templateDataMapper.js";

console.log("=================================================");
console.log("  WebRyza Template Data Mapper - Test Suite     ");
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
// 1. Test Date Normalization & Pretty Formatting
// -----------------------------------------------------------------------------
console.log("Section 1: Date Normalization & Formatting");

// ISO string
assert(normalizeDate("2026-11-30") === "2026-11-30", "normalizeDate handles YYYY-MM-DD");

// Firestore timestamp object { seconds, nanoseconds }
const firestoreTimestampObj = { seconds: 1796020200, nanoseconds: 0 };
const dateFromSeconds = normalizeDate(firestoreTimestampObj);
assert(dateFromSeconds === "2026-11-30", `normalizeDate handles Firestore Timestamp object (got ${dateFromSeconds})`);

// Pretty format
const prettyDate = formatDatePretty("2026-11-30");
assert(prettyDate.includes("November") && prettyDate.includes("2026"), `formatDatePretty formats correctly: ${prettyDate}`);

// -----------------------------------------------------------------------------
// 2. Test Parents Normalization
// -----------------------------------------------------------------------------
console.log("\nSection 2: Parents Normalization");

const stringParents = normalizeParents("Srinivas & Lakshmi");
assert(stringParents.text === "Srinivas & Lakshmi", "normalizeParents handles string format");

const objectParents = normalizeParents({ mother: "Lakshmi", father: "Srinivas" });
assert(objectParents.text === "Srinivas & Lakshmi", "normalizeParents handles { mother, father } object");
assert(objectParents.father === "Srinivas" && objectParents.mother === "Lakshmi", "normalizeParents extracts mother & father");

// -----------------------------------------------------------------------------
// 3. Test Actual Customer Firestore Document WR-8999
// -----------------------------------------------------------------------------
console.log("\nSection 3: Mapping Actual Firestore Customer Document (WR-8999)");

const actualFirestoreDoc = {
  weddingId: "WR-8999",
  templateId: "temple-heritage",
  brideName: "Priya",
  groomName: "Rahul",
  brideParents: "Srinivas & Lakshmi",
  groomParents: "Ramesh & Sita",
  weddingDate: { seconds: 1796020200, nanoseconds: 0 },
  weddingTime: "09:00 AM",
  venueName: "Asha conventions",
  venueAddress: "tirupati",
  venueLocation: "",
  events: [
    {
      eventName: "Haldi",
      date: "2026-11-30",
      time: "",
      venueName: "Asha conventions",
      venueAddress: "tirupati",
      locationLink: "",
      description: "",
    },
    {
      eventName: "Mehendi",
      date: "2026-11-30",
      time: "",
      venueName: "Asha conventions",
      venueAddress: "tirupati",
      locationLink: "",
      description: "",
    },
  ],
  phone: "9876543210",
  email: "customer@example.com",
  amountCharged: 1500,
  partnerCommission: 0,
  webryzaShare: 1000,
  amountDueToWebryza: 1000,
  adminNotes: "Internal note",
  partnerId: "P-100",
};

const mapped = mapFirestoreToTemplateData(actualFirestoreDoc, "WR-8999");

assert(mapped.weddingId === "WR-8999", "Wedding ID preserved");
assert(mapped.templateId === "temple-heritage", "Template ID normalized to temple-heritage");
assert(mapped.brideName === "Priya", "Bride name is Priya");
assert(mapped.groomName === "Rahul", "Groom name is Rahul");
assert(mapped.brideParents === "Srinivas & Lakshmi", "Bride parents preserved");
assert(mapped.groomParents === "Ramesh & Sita", "Groom parents preserved");
assert(mapped.weddingDate === "2026-11-30", `Wedding date normalized to 2026-11-30 (got ${mapped.weddingDate})`);
assert(mapped.weddingTime === "09:00 AM", "Wedding time preserved");
assert(mapped.venueName === "Asha conventions", "Venue name is Asha conventions");
assert(mapped.venueAddress === "tirupati", "Venue address is tirupati");
assert(mapped.googleMapsLink.includes("Asha%20conventions"), `Google Maps link auto-generated: ${mapped.googleMapsLink}`);
assert(mapped.events.length === 2, `Mapped exactly 2 events (got ${mapped.events.length})`);
assert(mapped.events[0].name === "Haldi" && mapped.events[0].venueName === "Asha conventions", "First event is Haldi at Asha conventions");
assert(mapped.events[0].icon === "💛", "Haldi event gets yellow heart icon 💛");
assert(mapped.events[1].name === "Mehendi" && mapped.events[1].venueName === "Asha conventions", "Second event is Mehendi at Asha conventions");
assert(mapped.events[1].icon === "🌸", "Mehendi event gets blossom icon 🌸");

// Privacy check
assert(mapped.phone === undefined, "Customer phone number is NOT exposed in template payload");
assert(mapped.email === undefined, "Customer email is NOT exposed in template payload");
assert(mapped.amountCharged === undefined, "Amount charged is NOT exposed");
assert(mapped.partnerCommission === undefined, "Partner commission is NOT exposed");
assert(mapped.adminNotes === undefined, "Admin notes are NOT exposed");
assert(mapped.grandparents === null, "Grandparents is null when not entered by customer (no fake defaults injected)");
assert(mapped.story === null, "Story is null when not entered by customer (no fake defaults injected)");

// -----------------------------------------------------------------------------
// 4. Test Synthesized Ceremony When Events Array is Empty
// -----------------------------------------------------------------------------
console.log("\nSection 4: Empty Events Synthesis (Ensures No Jaipur/Bellagio Fallbacks)");

const emptyEventsDoc = {
  weddingId: "WR-1691",
  templateId: "royal-gold",
  brideName: "Sneha",
  groomName: "Venkatesh",
  brideParents: "K. Rao",
  groomParents: "M. Rao",
  weddingDate: "2027-02-15",
  weddingTime: "10:30 AM",
  venueName: "Sri Venkateswara Kalyana Mandapam",
  venueAddress: "Tirupati",
  events: [],
};

const mappedEmpty = mapFirestoreToTemplateData(emptyEventsDoc, "WR-1691");
assert(mappedEmpty.events.length === 1, "Synthesizes exactly 1 event from ceremony details when events array is empty");
assert(mappedEmpty.events[0].name === "Wedding Ceremony", "Synthesized event named Wedding Ceremony");
assert(mappedEmpty.events[0].venueName === "Sri Venkateswara Kalyana Mandapam", "Synthesized event has customer's actual venue");
assert(mappedEmpty.events[0].date === "2027-02-15", "Synthesized event has customer's actual date");
assert(mappedEmpty.events[0].time === "10:30 AM", "Synthesized event has customer's actual time");

// -----------------------------------------------------------------------------
// 5. Test Template ID Normalization
// -----------------------------------------------------------------------------
console.log("\nSection 5: Template ID Normalization for all 4 Templates");

assert(normalizeTemplateId("royal-gold") === "royal-gold", "royal-gold normalized");
assert(normalizeTemplateId("temple-heritage") === "temple-heritage", "temple-heritage normalized");
assert(normalizeTemplateId("vishu-kavya") === "temple-heritage", "vishu-kavya mapped to temple-heritage");
assert(normalizeTemplateId("elegant-pastel-romance") === "elegant-pastel-romance", "elegant-pastel-romance normalized");
assert(normalizeTemplateId("pastel-romance") === "elegant-pastel-romance", "pastel-romance mapped to elegant-pastel-romance");
assert(normalizeTemplateId("lakecomo-letters") === "lakecomo-letters", "lakecomo-letters normalized");
assert(normalizeTemplateId("lake-como-letters") === "lakecomo-letters", "lake-como-letters normalized");
assert(normalizeTemplateId("floral-botanical-romance") === "lakecomo-letters", "floral-botanical-romance normalized to lakecomo-letters");

// -----------------------------------------------------------------------------
// 6. Test Dynamic Video Workflow (Preparation Message vs Uploaded Player)
// -----------------------------------------------------------------------------
console.log("\nSection 6: Dynamic Video Workflow & State Transitions");

// Scenario 1: Customer opts out of video in registration form
const noVideoDoc = {
  weddingId: "WR-1001",
  templateId: "royal-gold",
  brideName: "Ananya",
  groomName: "Kabir",
  aiVideoRequired: false,
  videoStatus: "not_requested",
  videoUrl: "",
};
const mappedNoVideo = mapFirestoreToTemplateData(noVideoDoc, "WR-1001");
assert(mappedNoVideo.aiVideoRequired === false, "aiVideoRequired is false when user opts out");
assert(mappedNoVideo.hasVideoSection === false, "hasVideoSection is false when user opts out (section hidden)");
assert(mappedNoVideo.isVideoUploaded === false, "isVideoUploaded is false when user opts out");
assert(mappedNoVideo.videoUrl === "", "videoUrl is empty string when user opts out");

// Scenario 2: Customer completes registration with video requested (Before Admin Upload)
const pendingVideoDoc = {
  weddingId: "WR-1002",
  templateId: "temple-heritage",
  brideName: "Priya",
  groomName: "Rahul",
  aiVideoRequired: true,
  videoStatus: "pending",
  videoUrl: "",
  videoPublicId: "",
  videoUploadedAt: null,
};
const mappedPending = mapFirestoreToTemplateData(pendingVideoDoc, "WR-1002");
assert(mappedPending.hasVideoSection === true, "hasVideoSection is true when video is requested");
assert(mappedPending.isVideoUploaded === false, "isVideoUploaded is false before admin upload (triggers preparation card)");
assert(mappedPending.videoStatus === "pending", "videoStatus is pending before admin upload");
assert(mappedPending.videoUrl === "", "videoUrl is empty before admin upload (no empty video player)");

// Scenario 3: Admin uploads video through Admin Panel
const uploadedVideoDoc = {
  weddingId: "WR-1002",
  templateId: "temple-heritage",
  brideName: "Priya",
  groomName: "Rahul",
  aiVideoRequired: true,
  videoStatus: "uploaded",
  videoUrl: "https://res.cloudinary.com/xbffuga9/video/upload/v1795680000/webryza/weddings/priya_rahul.mp4",
  videoPublicId: "webryza/weddings/priya_rahul",
  videoUploadedAt: { seconds: 1795680000, nanoseconds: 0 },
};
const mappedUploaded = mapFirestoreToTemplateData(uploadedVideoDoc, "WR-1002");
assert(mappedUploaded.hasVideoSection === true, "hasVideoSection remains true after upload");
assert(mappedUploaded.isVideoUploaded === true, "isVideoUploaded is true after admin upload (triggers video player)");
assert(mappedUploaded.videoStatus === "uploaded", "videoStatus is uploaded");
assert(mappedUploaded.videoUrl.includes("priya_rahul.mp4"), "videoUrl contains uploaded Cloudinary MP4 URL");
assert(mappedUploaded.videoPublicId === "webryza/weddings/priya_rahul", "videoPublicId preserved");

// Scenario 4: Another wedding isolation (Wedding WR-1003 has pending video while WR-1002 is uploaded)
const secondWeddingDoc = {
  weddingId: "WR-1003",
  templateId: "elegant-pastel-romance",
  brideName: "Meera",
  groomName: "Arjun",
  aiVideoRequired: true,
  videoStatus: "pending",
  videoUrl: "",
};
const mappedSecond = mapFirestoreToTemplateData(secondWeddingDoc, "WR-1003");
assert(mappedSecond.hasVideoSection === true, "Second wedding maintains its own video section");
assert(mappedSecond.isVideoUploaded === false, "Second wedding maintains its own pending status independently");
assert(mappedUploaded.isVideoUploaded === true, "First wedding remains uploaded independently");

// Scenario 5: Admin replaces video with a newer version
const replacedVideoDoc = {
  ...uploadedVideoDoc,
  videoUrl: "https://res.cloudinary.com/xbffuga9/video/upload/v1795690000/webryza/weddings/priya_rahul_v2.mp4",
  videoPublicId: "webryza/weddings/priya_rahul_v2",
};
const mappedReplaced = mapFirestoreToTemplateData(replacedVideoDoc, "WR-1002");
assert(mappedReplaced.isVideoUploaded === true, "isVideoUploaded is true for replaced video");
assert(mappedReplaced.videoUrl.includes("priya_rahul_v2.mp4"), "videoUrl reflects the latest replaced video");

// Scenario 6: Admin removes video (reverts to preparation message)
const removedVideoDoc = {
  ...uploadedVideoDoc,
  videoUrl: "",
  videoStatus: "pending",
  videoPublicId: "",
};
const mappedRemoved = mapFirestoreToTemplateData(removedVideoDoc, "WR-1002");
assert(mappedRemoved.hasVideoSection === true, "hasVideoSection remains true when video is removed");
assert(mappedRemoved.isVideoUploaded === false, "isVideoUploaded becomes false when video is removed (reverts to preparation message)");
assert(mappedRemoved.videoStatus === "pending", "videoStatus reverts to pending");
assert(mappedRemoved.videoUrl === "", "videoUrl is cleared");

// Scenario 7: All 4 templates support dynamic video state
for (const tmpl of ["royal-gold", "temple-heritage", "elegant-pastel-romance", "lakecomo-letters"]) {
  const tDoc = { weddingId: "TEST", templateId: tmpl, brideName: "A", groomName: "B", aiVideoRequired: true };
  const mapped = mapFirestoreToTemplateData(tDoc, "TEST");
  assert(mapped.hasVideoSection === true && mapped.isVideoUploaded === false, `Template ${tmpl} handles pending video correctly`);
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n=================================================");
console.log(`  Tests Completed: ${passed} / ${total} passed`);
console.log("=================================================\n");

if (passed === total) {
  console.log("  >>> ALL TEMPLATE DATA MAPPER TESTS PASSED! <<<\n");
  process.exit(0);
} else {
  console.error("  >>> SOME TESTS FAILED! <<<\n");
  process.exit(1);
}
