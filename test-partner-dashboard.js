/**
 * Comprehensive Automated Test Suite for WebRyza Partner Admin
 * Verifies all 7 scenarios in Part 14:
 * Scenario 1: Customer submits ₹2,000 order (Verification Pending)
 * Scenario 2: Admin verifies payment (Verified -> ₹500 Earned)
 * Scenario 3: Admin rejects payment (Rejected -> ₹0 / Not Earned + Rejection Reason)
 * Scenario 4: Customer submits ₹3,000 order (Fixed ₹500 commission, NOT tiered/percentage)
 * Scenario 5: Admin records ₹500 payout (Already Paid +₹500, Remaining Payable -₹500)
 * Scenario 6: Partner data isolation by partnerId
 * Scenario 7: Backward compatibility with legacy records
 */

import {
  normalizePartnerProject,
  calculatePartnerDashboardMetrics,
  FIXED_PARTNER_COMMISSION,
} from './src/utils/partnerProjectNormalizer.js';
import { isWeddingCardTrashed } from './src/utils/cardStatus.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('======================================================');
console.log(' WebRyza Partner Admin - Verification & Test Suite');
console.log('======================================================\n');

// --------------------------------------------------------------------------
// SCENARIO 1: Customer submits a ₹2,000 wedding order (Verification Pending)
// --------------------------------------------------------------------------
console.log('--- SCENARIO 1: ₹2,000 Submission (Verification Pending) ---');
const docS1 = {
  weddingId: 'WR-1001',
  brideName: 'Sneha',
  groomName: 'Arjun',
  phone: '9876543210',
  partnerId: 'SHOP001',
  amountCharged: 2000,
  paymentStatus: 'pending',
  payment: {
    amount: 2000,
    status: 'Verification Pending',
    transactionReference: 'UPI-123456789012',
  },
  websiteUrl: 'https://cards.webryza.in/card=WR-1001',
};

const projectS1 = normalizePartnerProject('doc1', docS1);
assert(projectS1.customerPaymentAmount === 2000, 'Customer payment amount displays ₹2,000');
assert(projectS1.paymentStatus === 'Verification Pending', 'Payment status displays Verification Pending');
assert(projectS1.partnerCommission === 500, 'Commission is set to 500');
assert(projectS1.commissionStatus === 'Pending', 'Commission status is Pending');
assert(projectS1.displayCommission === '₹500 Pending', 'Display commission shows "₹500 Pending"');
assert(projectS1.isEarned === false, 'Commission is not earned yet');

const metricsS1 = calculatePartnerDashboardMetrics([projectS1], { partnerId: 'SHOP001' });
assert(metricsS1.totalProjects === 1, 'Total Projects count is 1');
assert(metricsS1.partnerEarnings === 0, 'Partner Earnings does not increase yet (₹0)');
assert(metricsS1.pendingProjectsCount === 1, 'Pending Payment count is 1');
assert(metricsS1.pendingPaymentAmount === 2000, 'Pending Payment amount is ₹2,000');
assert(metricsS1.totalCustomerPaid === 0, 'Total Paid verified is 0');

// --------------------------------------------------------------------------
// SCENARIO 2: Main Admin verifies ₹2,000 payment
// --------------------------------------------------------------------------
console.log('\n--- SCENARIO 2: Admin Verifies Payment (Verified) ---');
const docS2 = {
  ...docS1,
  paymentStatus: 'verified',
  payment: {
    ...docS1.payment,
    status: 'Verified',
  },
};

const projectS2 = normalizePartnerProject('doc1', docS2);
assert(projectS2.paymentStatus === 'Verified', 'Payment status becomes Verified');
assert(projectS2.commissionStatus === 'Earned', 'Commission status becomes Earned');
assert(projectS2.partnerCommission === 500, 'Partner commission is ₹500');
assert(projectS2.isEarned === true, 'Commission is marked as earned');

const metricsS2 = calculatePartnerDashboardMetrics([projectS2], { partnerId: 'SHOP001' });
assert(metricsS2.partnerEarnings === 500, 'Partner Earnings increases by ₹500');
assert(metricsS2.totalCustomerPaid === 2000, 'Total Paid increases by ₹2,000');
assert(metricsS2.pendingProjectsCount === 0, 'Pending Payment count is now 0');
assert(metricsS2.pendingPaymentAmount === 0, 'Pending Payment amount is now 0');

// --------------------------------------------------------------------------
// SCENARIO 3: Main Admin rejects payment
// --------------------------------------------------------------------------
console.log('\n--- SCENARIO 3: Admin Rejects Payment ---');
const docS3 = {
  ...docS1,
  paymentStatus: 'rejected',
  payment: {
    ...docS1.payment,
    status: 'Rejected',
    rejectionReason: 'Transaction amount does not match the submitted order amount.',
    rejectedAt: { seconds: 1732629600 },
  },
};

const projectS3 = normalizePartnerProject('doc1', docS3);
assert(projectS3.paymentStatus === 'Rejected', 'Payment status becomes Rejected');
assert(projectS3.partnerCommission === 0, 'Partner commission becomes ₹0');
assert(projectS3.commissionStatus === 'Not Earned', 'Commission status is Not Earned');
assert(projectS3.displayCommission === '₹0 / Not Earned', 'Display shows ₹0 / Not Earned');
assert(projectS3.rejectionReason.includes('does not match'), 'Rejection reason is visible to partner');

const metricsS3 = calculatePartnerDashboardMetrics([projectS3], { partnerId: 'SHOP001' });
assert(metricsS3.partnerEarnings === 0, 'No commission added to Partner Earnings');
assert(metricsS3.pendingProjectsCount === 0, 'Pending payment count decreased to 0');
assert(metricsS3.totalCustomerPaid === 0, 'Total Paid is 0');

// --------------------------------------------------------------------------
// SCENARIO 4: Customer submits ₹3,000 order and payment is verified (Fixed ₹500 rule)
// --------------------------------------------------------------------------
console.log('\n--- SCENARIO 4: ₹3,000 Order Verified (Fixed ₹500, Not Percentage) ---');
const docS4 = {
  weddingId: 'WR-1002',
  brideName: 'Priya',
  groomName: 'Rahul',
  partnerId: 'SHOP001',
  amountCharged: 3000,
  payment: {
    amount: 3000,
    status: 'Verified',
  },
};

const projectS4 = normalizePartnerProject('doc2', docS4);
assert(projectS4.customerPaymentAmount === 3000, 'Customer Payment Amount is ₹3,000');
assert(projectS4.partnerCommission === 500, 'Partner Commission is strictly ₹500 (NOT tiered or percentage)');

// Combined with Project 2 (two verified projects: ₹2,000 + ₹3,000)
const metricsS4 = calculatePartnerDashboardMetrics([projectS2, projectS4], { partnerId: 'SHOP001' });
assert(metricsS4.totalProjects === 2, 'Total Projects = 2');
assert(metricsS4.partnerEarnings === 1000, 'Partner Earnings is 2 × ₹500 = ₹1,000');
assert(metricsS4.totalCustomerPaid === 5000, 'Total Paid verified is ₹2,000 + ₹3,000 = ₹5,000');

// --------------------------------------------------------------------------
// SCENARIO 5: Main Admin records a ₹500 partner payout
// --------------------------------------------------------------------------
console.log('\n--- SCENARIO 5: Admin Records Partner Payout ---');
// Partner profile with recorded payout of ₹500
const partnerProfileWithPayout = {
  partnerId: 'SHOP001',
  alreadyPaid: 500,
};

const metricsS5 = calculatePartnerDashboardMetrics([projectS2, projectS4], partnerProfileWithPayout);
assert(metricsS5.totalEarned === 1000, 'Total Earned is ₹1,000');
assert(metricsS5.alreadyPaid === 500, 'Already Paid displays ₹500');
assert(metricsS5.remainingPayable === 500, 'Remaining Payable is ₹1,000 - ₹500 = ₹500');

// --------------------------------------------------------------------------
// SCENARIO 6: Partner Data Isolation
// --------------------------------------------------------------------------
console.log('\n--- SCENARIO 6: Partner Data Isolation ---');
const allProjectsInDb = [
  { ...projectS2, partnerId: 'SHOP001' },
  { ...projectS4, partnerId: 'SHOP001' },
  { id: 'doc3', partnerId: 'SHOP002', customerPaymentAmount: 4000, paymentStatus: 'Verified' },
];

const shop001Projects = allProjectsInDb.filter(p => p.partnerId === 'SHOP001');
const shop002Projects = allProjectsInDb.filter(p => p.partnerId === 'SHOP002');

assert(shop001Projects.length === 2, 'SHOP001 receives only their 2 projects');
assert(shop002Projects.length === 1, 'SHOP002 receives only their 1 project');
const shop002Metrics = calculatePartnerDashboardMetrics(shop002Projects, { partnerId: 'SHOP002' });
assert(shop002Metrics.partnerEarnings === 500, 'SHOP002 earnings isolated to ₹500');

// --------------------------------------------------------------------------
// SCENARIO 7: Backward Compatibility with Legacy Records
// --------------------------------------------------------------------------
console.log('\n--- SCENARIO 7: Legacy Document Compatibility ---');
const legacyDoc = {
  weddingId: '0001',
  brideName: 'Kavya',
  groomName: 'Vishu',
  partnerId: 'SHOP001',
  amountCharged: 1500,
  webryzaShare: 1000,
  amountReceivedByWebryza: 0,
  // No payment object or status field
};

const normalizedLegacy = normalizePartnerProject('legacy1', legacyDoc);
assert(normalizedLegacy.paymentStatus === 'Verification Pending', 'Legacy record safely defaults to Verification Pending');
assert(normalizedLegacy.partnerCommission === 500, 'Legacy record defaults to fixed ₹500 rule');
assert(normalizedLegacy.commissionStatus === 'Pending', 'Legacy commission is Pending');
assert(normalizedLegacy.customerPaymentAmount === 1500, 'Preserves legacy amountCharged ₹1,500');

// --------------------------------------------------------------------------
// SCENARIO 8: Trash & Restoration Handling in Partner Admin
// --------------------------------------------------------------------------
console.log('\n--- SCENARIO 8: Trash & Restoration Handling in Partner Admin ---');

// 1. Initial State: Two active projects for SHOP001 (one verified ₹500, one pending)
const rawDocActive1 = {
  id: 'docA',
  weddingId: 'WR-1001',
  brideName: 'Sneha',
  groomName: 'Arjun',
  partnerId: 'SHOP001',
  amountCharged: 2000,
  paymentStatus: 'verified',
  payment: { amount: 2000, status: 'Verified' },
  isDeleted: false,
};

const rawDocActive2 = {
  id: 'docB',
  weddingId: 'WR-1002',
  brideName: 'Priya',
  groomName: 'Rahul',
  partnerId: 'SHOP001',
  amountCharged: 3000,
  paymentStatus: 'pending',
  payment: { amount: 3000, status: 'Verification Pending' },
  isDeleted: false,
};

// Snapshot with 2 active projects
const snapshot1Docs = [rawDocActive1, rawDocActive2];
const activeFiltered1 = snapshot1Docs.filter(d => !isWeddingCardTrashed(d)).map(d => normalizePartnerProject(d.id, d));
assert(activeFiltered1.length === 2, 'Initially 2 active wedding projects appear in Partner Admin');
const metricsInitial = calculatePartnerDashboardMetrics(activeFiltered1, { alreadyPaid: 0 });
assert(metricsInitial.totalProjects === 2, 'Total Projects = 2');
assert(metricsInitial.partnerEarnings === 500, 'Partner Earnings = ₹500 (from 1 verified project)');
assert(metricsInitial.pendingProjectsCount === 1, 'Pending Payment count = 1');
assert(metricsInitial.pendingPaymentAmount === 3000, 'Pending Payment amount = ₹3,000');

// 2. Admin moves docA (verified project) to Trash
const rawDocTrashedA = {
  ...rawDocActive1,
  isDeleted: true,
  status: 'trashed',
  deletedAt: { seconds: 1732700000 },
};

const snapshot2Docs = [rawDocTrashedA, rawDocActive2];
const activeFiltered2 = snapshot2Docs.filter(d => !isWeddingCardTrashed(d)).map(d => normalizePartnerProject(d.id, d));
assert(activeFiltered2.length === 1, 'Moving docA to Trash removes it from Partner Admin active projects');
assert(activeFiltered2[0].weddingId === 'WR-1002', 'Only active project WR-1002 remains visible');

const metricsAfterTrash = calculatePartnerDashboardMetrics(activeFiltered2, { alreadyPaid: 0 });
assert(metricsAfterTrash.totalProjects === 1, 'Total Projects decrements to 1');
assert(metricsAfterTrash.partnerEarnings === 0, 'Partner Earnings for trashed card excluded (₹0)');
assert(metricsAfterTrash.totalCustomerPaid === 0, 'Customer payment of trashed project excluded from Total Paid');

// 3. Admin restores docA
const rawDocRestoredA = {
  ...rawDocTrashedA,
  isDeleted: false,
  status: 'published',
  restoredAt: { seconds: 1732710000 },
};

const snapshot3Docs = [rawDocRestoredA, rawDocActive2];
const activeFiltered3 = snapshot3Docs.filter(d => !isWeddingCardTrashed(d)).map(d => normalizePartnerProject(d.id, d));
assert(activeFiltered3.length === 2, 'Restoring wedding makes it reappear in Partner Admin');
const restoredProject = activeFiltered3.find(p => p.weddingId === 'WR-1001');
assert(restoredProject.partnerId === 'SHOP001', 'Partner attribution remains unchanged (SHOP001)');
assert(restoredProject.weddingId === 'WR-1001', 'Wedding ID remains unchanged (WR-1001)');
assert(restoredProject.customerPaymentAmount === 2000, 'Customer payment amount remains ₹2,000');
assert(restoredProject.paymentStatus === 'Verified', 'Payment status remains Verified');
assert(restoredProject.partnerCommission === 500, 'Partner commission remains fixed ₹500');

// 4. Partner earnings are NOT duplicated
const metricsAfterRestore = calculatePartnerDashboardMetrics(activeFiltered3, { alreadyPaid: 500 });
assert(metricsAfterRestore.totalProjects === 2, 'Total Projects restored to 2');
assert(metricsAfterRestore.partnerEarnings === 500, 'Partner Earnings are NOT duplicated (strictly 1 × ₹500 = ₹500)');
assert(metricsAfterRestore.alreadyPaid === 500, 'Existing payout records remain unchanged (₹500)');
assert(metricsAfterRestore.remainingPayable === 0, 'Remaining Payable is ₹500 - ₹500 = ₹0');

console.log('\n======================================================');
console.log(` Partner Admin Test Results: ${passed} passed, ${failed} failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
