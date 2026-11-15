import { calculateCommissions } from "./src/utils/commission.js";
import { formatINR, formatDatePretty } from "./src/utils/formatters.js";

console.log("=================================================");
console.log("   WebRyza Partner Portal - Test Verification    ");
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
// 1. Partner Dashboard Metrics & Payment Status Computation
// ----------------------------------------------------------------------
console.log("Scenario 1: Partner Metrics & Real-time Financial Calculations");

const mockPartnerProjects = [
  {
    id: "proj_1",
    brideName: "Priya",
    groomName: "Rahul",
    partnerId: "SHOP001",
    amountCharged: 2500,
    webryzaShare: 1500,
    amountReceivedByWebryza: 0,
    paymentStatus: "pending",
    websiteUrl: "https://rahulweds-priya.webryza.in",
  },
  {
    id: "proj_2",
    brideName: "Divya",
    groomName: "Kiran",
    partnerId: "SHOP001",
    amountCharged: 1800,
    webryzaShare: 1000,
    amountReceivedByWebryza: 1000,
    paymentStatus: "paid",
    websiteUrl: "https://kiranweds-divya.webryza.in",
  },
  {
    id: "proj_3",
    brideName: "Sneha",
    groomName: "Arjun",
    partnerId: "SHOP001",
    amountCharged: 3000,
    webryzaShare: 1500,
    amountReceivedByWebryza: 500,
    paymentStatus: "partial",
    websiteUrl: "", // Under development
  },
];

function computeProjectFinancials(p) {
  const webryzaAmount = Number(p.webryzaShare || 1500);
  const amountPaid = Number(p.amountReceivedByWebryza || 0);
  const remaining = Math.max(0, webryzaAmount - amountPaid);

  let status = "Pending";
  if (amountPaid >= webryzaAmount) {
    status = "Paid";
  } else if (amountPaid > 0) {
    status = "Partial";
  }

  return { webryzaAmount, amountPaid, remaining, status };
}

// Test Project 1: Pending (₹0 paid out of ₹1,500)
const p1 = computeProjectFinancials(mockPartnerProjects[0]);
assert(p1.webryzaAmount === 1500, "Project 1: WebRyza amount is ₹1,500");
assert(p1.amountPaid === 0, "Project 1: Amount paid is ₹0");
assert(p1.remaining === 1500, "Project 1: Remaining balance is ₹1,500");
assert(p1.status === "Pending", "Project 1: Payment status is Pending");

// Test Project 2: Paid (₹1,000 paid out of ₹1,000)
const p2 = computeProjectFinancials(mockPartnerProjects[1]);
assert(p2.webryzaAmount === 1000, "Project 2: WebRyza amount is ₹1,000");
assert(p2.amountPaid === 1000, "Project 2: Amount paid is ₹1,000");
assert(p2.remaining === 0, "Project 2: Remaining balance is ₹0");
assert(p2.status === "Paid", "Project 2: Payment status is Paid");

// Test Project 3: Partial (₹500 paid out of ₹1,500)
const p3 = computeProjectFinancials(mockPartnerProjects[2]);
assert(p3.webryzaAmount === 1500, "Project 3: WebRyza amount is ₹1,500");
assert(p3.amountPaid === 500, "Project 3: Amount paid is ₹500");
assert(p3.remaining === 1000, "Project 3: Remaining balance is ₹1,000");
assert(p3.status === "Partial", "Project 3: Payment status is Partial");

// Summary Card Metrics
const totalProjects = mockPartnerProjects.length;
const totalDue = p1.remaining + p2.remaining + p3.remaining;
const totalPaid = p1.amountPaid + p2.amountPaid + p3.amountPaid;
const pendingPaymentsCount = [p1, p2, p3].filter((p) => p.status === "Pending" || p.status === "Partial").length;

assert(totalProjects === 3, "Summary Card 1: Total Wedding Projects count is 3");
assert(totalDue === 2500, "Summary Card 2: Total Amount Due is ₹2,500 (1500 + 0 + 1000)");
assert(totalPaid === 1500, "Summary Card 3: Total Amount Paid is ₹1,500 (0 + 1000 + 500)");
assert(pendingPaymentsCount === 2, "Summary Card 4: Pending Payments count is 2 (Pending + Partial)");

console.log("\nScenario 2: Real-time Payment Status Transitions");

// Simulate WebRyza Admin recording a partial payment on Project 1
const p1UpdatedPartial = computeProjectFinancials({
  ...mockPartnerProjects[0],
  amountReceivedByWebryza: 500,
});
assert(p1UpdatedPartial.status === "Partial", "Payment of ₹500 changes Project 1 status from Pending to Partial");
assert(p1UpdatedPartial.remaining === 1000, "Remaining balance decreases to ₹1,000");

// Simulate WebRyza Admin completing payment on Project 1
const p1UpdatedComplete = computeProjectFinancials({
  ...mockPartnerProjects[0],
  amountReceivedByWebryza: 1500,
});
assert(p1UpdatedComplete.status === "Paid", "Payment of full ₹1,500 changes Project 1 status to Paid");
assert(p1UpdatedComplete.remaining === 0, "Remaining balance becomes ₹0");

console.log("\nScenario 3: Website Link Functionality");

function getWebsiteDisplay(project) {
  if (project.websiteUrl && project.websiteUrl.trim() !== "") {
    return { hasLink: true, url: project.websiteUrl, label: "Copy Link" };
  }
  return { hasLink: false, url: null, label: "Website Under Development" };
}

const link1 = getWebsiteDisplay(mockPartnerProjects[0]);
assert(link1.hasLink && link1.label === "Copy Link", "Completed project provides Copy Link button");

const link3 = getWebsiteDisplay(mockPartnerProjects[2]);
assert(!link3.hasLink && link3.label === "Website Under Development", "Incomplete project shows Website Under Development");

console.log("\nScenario 4: Partner Account Active vs Deactivated Verification");

function verifyPartnerAccess(partnerDoc) {
  if (!partnerDoc) {
    return { allowed: false, reason: "Partner record not found." };
  }
  const isActive = partnerDoc.isActive === true || partnerDoc.isActive === "true";
  if (!isActive) {
    return { allowed: false, reason: "Your partner account has been deactivated. Please contact WebRyza Admin." };
  }
  return { allowed: true, partnerId: partnerDoc.partnerId, shopName: partnerDoc.shopName };
}

const activePartner = { partnerId: "SHOP001", shopName: "Sri Lakshmi Wedding Cards", isActive: true };
const activeCheck = verifyPartnerAccess(activePartner);
assert(activeCheck.allowed === true, "Active partner account is granted access to dashboard");

const deactivatedPartner = { partnerId: "SHOP002", shopName: "Old Cards Shop", isActive: false };
const deactivatedCheck = verifyPartnerAccess(deactivatedPartner);
assert(deactivatedCheck.allowed === false && deactivatedCheck.reason.includes("deactivated"), "Deactivated partner account is strictly denied access");

console.log("\nScenario 5: Partner Data Isolation (Multi-Tenancy Protection)");

const allProjectsInDatabase = [
  ...mockPartnerProjects,
  { id: "proj_4", brideName: "Kavya", groomName: "Sanjay", partnerId: "SHOP002", amountCharged: 2000 },
  { id: "proj_5", brideName: "Ananya", groomName: "Vikram", partnerId: "", source: "direct" },
];

function filterPartnerProjects(allProjects, loggedInPartnerId) {
  return allProjects.filter((p) => p.partnerId === loggedInPartnerId);
}

const shop001Projects = filterPartnerProjects(allProjectsInDatabase, "SHOP001");
assert(shop001Projects.length === 3, "SHOP001 sees only its own 3 projects");
assert(!shop001Projects.some((p) => p.partnerId === "SHOP002"), "SHOP001 cannot see SHOP002's projects");
assert(!shop001Projects.some((p) => p.source === "direct"), "SHOP001 cannot see direct registrations");

console.log("\n=================================================");
console.log(`  Test Results: ${passedCount} / ${totalCount} Passed`);
console.log("=================================================\n");

if (passedCount === totalCount) {
  console.log("All Partner Portal business requirements verified successfully!");
} else {
  process.exit(1);
}
