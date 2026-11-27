/**
 * WebRyza Partner Project Normalizer & Commission Calculator
 * 
 * New Commission Rules (Part 1):
 * - Fixed ₹500 partner commission for every successfully paid and admin-verified wedding project.
 * - Customer-entered payment amount (₹1,500, ₹2,000, ₹2,500, etc.) does NOT change partner commission.
 * - Commission is earned ONLY after WebRyza Admin verifies the payment.
 * - Pending payment: ₹500 Pending.
 * - Rejected payment: ₹0 / Not Earned.
 * - WebRyza share/revenue is never computed or displayed to partners.
 */

import { formatDatePretty } from "./formatters.js";
import { isWeddingCardTrashed } from "./cardStatus.js";

export const FIXED_PARTNER_COMMISSION = 500;

/**
 * Normalizes payment status from raw document data
 * Returns one of: "Verified" | "Verification Pending" | "Rejected"
 */
export function normalizePaymentStatus(data = {}) {
  const rawStatus = (
    data.payment?.status ||
    data.paymentStatus ||
    ""
  ).toString().trim().toLowerCase();

  if (rawStatus === "verified" || rawStatus === "paid" || rawStatus === "completed") {
    return "Verified";
  }

  if (rawStatus === "rejected" || rawStatus === "failed" || rawStatus === "declined") {
    return "Rejected";
  }

  // Default for "pending", "verification pending", "partial", or missing
  return "Verification Pending";
}

/**
 * Normalizes commission status and partner commission amount based on payment status
 */
export function normalizeCommission(data = {}, paymentStatus) {
  if (paymentStatus === "Rejected") {
    return {
      partnerCommission: 0,
      commissionStatus: "Not Earned", // "Not Earned"
      displayCommission: "₹0 / Not Earned",
      isEarned: false,
      isPaid: false,
    };
  }

  if (paymentStatus === "Verified") {
    const rawCommStatus = (
      data.commission?.status ||
      data.partnerCommissionStatus ||
      (data.commissionPaid ? "paid" : "")
    ).toString().trim().toLowerCase();

    const isPaid = rawCommStatus === "paid";
    return {
      partnerCommission: FIXED_PARTNER_COMMISSION,
      commissionStatus: isPaid ? "Paid" : "Earned",
      displayCommission: "₹500",
      isEarned: true,
      isPaid: isPaid,
    };
  }

  // Verification Pending
  return {
    partnerCommission: FIXED_PARTNER_COMMISSION,
    commissionStatus: "Pending",
    displayCommission: "₹500 Pending",
    isEarned: false,
    isPaid: false,
  };
}

/**
 * Normalizes a single Firestore wedding project document for Partner Admin display
 */
export function normalizePartnerProject(docId, data = {}) {
  const customerPaymentAmount = Number(
    data.payment?.amount ||
    data.amountCharged ||
    0
  );

  const paymentStatus = normalizePaymentStatus(data);
  const commissionInfo = normalizeCommission(data, paymentStatus);

  // Normalize project status (Confirmed / Building / Completed / Cancelled)
  let projectStatus = "Confirmed";
  if (data.isDeleted === true || data.status === "trashed" || data.status === "deleted") {
    projectStatus = "Cancelled";
  } else if (data.projectStatus) {
    projectStatus = data.projectStatus;
  } else if (data.websiteUrl && data.websiteUrl.trim() !== "") {
    projectStatus = "Completed";
  } else if (data.status) {
    const s = data.status.toLowerCase();
    if (s === "building" || s === "in_progress") projectStatus = "Building";
    else if (s === "completed" || s === "done") projectStatus = "Completed";
    else if (s === "cancelled") projectStatus = "Cancelled";
    else projectStatus = "Confirmed";
  }

  // Normalize wedding date
  let formattedWeddingDate = "—";
  let rawDateObj = null;
  if (data.weddingDate?.toDate) {
    rawDateObj = data.weddingDate.toDate();
    formattedWeddingDate = formatDatePretty(rawDateObj.toISOString().split("T")[0]);
  } else if (typeof data.weddingDate === "string") {
    formattedWeddingDate = formatDatePretty(data.weddingDate);
    rawDateObj = new Date(data.weddingDate);
  }

  // Normalize created timestamp
  let createdMillis = 0;
  let formattedCreatedDate = "—";
  if (data.createdAt?.toMillis) {
    createdMillis = data.createdAt.toMillis();
    formattedCreatedDate = formatDatePretty(new Date(createdMillis).toISOString().split("T")[0]);
  } else if (data.createdAt?.seconds) {
    createdMillis = data.createdAt.seconds * 1000;
    formattedCreatedDate = formatDatePretty(new Date(createdMillis).toISOString().split("T")[0]);
  }

  // Payment submission date
  let formattedPaymentSubmittedAt = "—";
  const subDate = data.payment?.submittedAt;
  if (subDate?.toMillis) {
    formattedPaymentSubmittedAt = formatDatePretty(new Date(subDate.toMillis()).toISOString().split("T")[0]);
  } else if (subDate?.seconds) {
    formattedPaymentSubmittedAt = formatDatePretty(new Date(subDate.seconds * 1000).toISOString().split("T")[0]);
  } else if (createdMillis > 0) {
    formattedPaymentSubmittedAt = formattedCreatedDate;
  }

  // Rejection details
  const rejectionReason = (
    data.payment?.rejectionReason ||
    data.rejectionReason ||
    ""
  ).trim();

  let formattedRejectedAt = "";
  const rejDate = data.payment?.rejectedAt || data.rejectedAt;
  if (rejDate?.toMillis) {
    formattedRejectedAt = formatDatePretty(new Date(rejDate.toMillis()).toISOString().split("T")[0]);
  } else if (rejDate?.seconds) {
    formattedRejectedAt = formatDatePretty(new Date(rejDate.seconds * 1000).toISOString().split("T")[0]);
  }

  // UTR / Transaction reference
  const transactionReference = (
    data.payment?.transactionReference ||
    data.transactionReference ||
    data.utr ||
    ""
  ).trim();

  // Video details
  const videoRequired = Boolean(data.videoRequired ?? data.aiVideoRequired ?? false);
  const videoStyle = videoRequired ? (data.videoStyle || data.aiVideoStyle || "Standard Video") : null;

  return {
    id: docId,
    weddingId: data.weddingId || docId,
    brideName: (data.brideName || "").trim(),
    groomName: (data.groomName || "").trim(),
    phone: (data.phone || "").trim(),
    email: (data.email || "").trim(),
    venueName: (data.venueName || "").trim(),
    venueAddress: (data.venueAddress || "").trim(),
    templateId: data.templateId || "royal-gold",
    websiteUrl: (data.websiteUrl || "").trim(),
    
    // Financial & Payment details (Sanitized for Partner: No WebRyza revenue)
    customerPaymentAmount,
    paymentStatus, // "Verified" | "Verification Pending" | "Rejected"
    partnerCommission: commissionInfo.partnerCommission,
    commissionStatus: commissionInfo.commissionStatus, // "Pending" | "Earned" | "Paid" | "Not Earned"
    displayCommission: commissionInfo.displayCommission,
    isEarned: commissionInfo.isEarned,
    isPaid: commissionInfo.isPaid,
    
    transactionReference,
    rejectionReason,
    formattedRejectedAt,
    formattedPaymentSubmittedAt,
    
    projectStatus,
    formattedWeddingDate,
    rawDateObj,
    createdMillis,
    formattedCreatedDate,
    
    videoRequired,
    videoStyle,
    
    // Store original fields safely (excluding private credentials)
    partnerId: data.partnerId || "",
    partnerShopName: data.partnerShopName || "",
    isDeleted: isWeddingCardTrashed(data),
  };
}

/**
 * Calculates Dashboard Financial Metrics for Partner (Part 2 & Part 3)
 * Automatically excludes any soft-deleted / trashed projects from metrics
 */
export function calculatePartnerDashboardMetrics(projects = [], partnerProfile = {}) {
  // Only active projects count towards Total Projects and Financial Metrics
  const activeProjects = projects.filter(
    (p) => !isWeddingCardTrashed(p) && p.isDeleted !== true
  );

  const totalProjects = activeProjects.length;

  let verifiedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  let totalCustomerPaid = 0; // Verified customer payments
  let pendingPaymentAmount = 0; // Pending customer payments

  activeProjects.forEach((p) => {
    if (p.paymentStatus === "Verified") {
      verifiedCount++;
      totalCustomerPaid += p.customerPaymentAmount;
    } else if (p.paymentStatus === "Rejected") {
      rejectedCount++;
    } else {
      pendingCount++;
      pendingPaymentAmount += p.customerPaymentAmount;
    }
  });

  // Card 1: Partner Earnings = Number of Verified Eligible Projects × ₹500
  const partnerEarnings = verifiedCount * FIXED_PARTNER_COMMISSION;

  // Partner Earnings Breakdown (Part 3)
  // Already paid comes from partnerProfile document or count of projects marked "Paid"
  const profilePaid = Number(partnerProfile.alreadyPaid || partnerProfile.totalPayouts || 0);
  const projectPaidCount = activeProjects.filter((p) => p.isPaid).length;
  const projectPaidSum = projectPaidCount * FIXED_PARTNER_COMMISSION;
  const alreadyPaid = Math.max(profilePaid, projectPaidSum);

  const remainingPayable = Math.max(0, partnerEarnings - alreadyPaid);

  return {
    totalProjects,
    verifiedCount,
    pendingCount,
    rejectedCount,
    
    // 4 Main Cards:
    partnerEarnings, // Card 1
    // totalProjects is Card 2
    totalCustomerPaid, // Card 3: Total Paid
    pendingPaymentAmount, // Card 4: Pending Payment amount
    pendingProjectsCount: pendingCount, // Card 4: Pending projects count
    
    // Earnings Details Breakdown:
    commissionPerProject: FIXED_PARTNER_COMMISSION,
    totalEarned: partnerEarnings,
    alreadyPaid,
    remainingPayable,
  };
}
