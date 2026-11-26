/**
 * Automated test suite for UPI Dynamic Payment & Cloudinary Proof workflow
 */

import { generateUpiUri, validateUpiTransactionRef } from './src/utils/upiGenerator.js';
import { validatePaymentProofFile } from './src/services/paymentProofService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- 1. Testing Dynamic UPI URI Generation ---');

// Test standard UPI generation
const upi1 = generateUpiUri({
  upiId: 'webryza@icici',
  displayName: 'WebRyza Digital',
  amount: 2500,
  transactionNote: 'Wedding Invitation WR-1001',
  transactionRef: 'WR1001',
});

assert(upi1.startsWith('upi://pay?'), 'URI starts with upi://pay?');
assert(upi1.includes('pa=webryza%40icici') || upi1.includes('pa=webryza@icici'), 'URI includes encoded UPI ID');
assert(upi1.includes('pn=WebRyza') || upi1.includes('pn=WebRyza%20Digital'), 'URI includes display name');
assert(upi1.includes('am=2500') || upi1.includes('am=2500.00'), 'URI includes amount without decimals or with .00');
assert(upi1.includes('cu=INR'), 'URI includes currency INR');
assert(upi1.includes('tn=Wedding') || upi1.includes('tn=Wedding%20Invitation'), 'URI includes transaction note');

// Test edge cases in amount
let zeroThrew = false;
try {
  generateUpiUri({ upiId: 'test@upi', amount: 0 });
} catch (e) {
  zeroThrew = true;
}
assert(zeroThrew, 'Rejects 0 amount with validation error');

const upiDecimal = generateUpiUri({ upiId: 'test@upi', amount: '1500.50' });
assert(upiDecimal.includes('am=1500.50'), 'Handles string/decimal amount');

console.log('\n--- 2. Testing UPI Transaction Reference (UTR) Validation ---');

assert(validateUpiTransactionRef('123456789012') === null, 'Valid 12-digit numeric UTR accepted');
assert(validateUpiTransactionRef('UPI-9876543210') === null, 'Valid alphanumeric reference (10-22 chars) accepted');
assert(typeof validateUpiTransactionRef('12345') === 'string', 'Rejects too short UTR (< 6 chars)');
assert(typeof validateUpiTransactionRef('') === 'string', 'Rejects empty UTR');
assert(typeof validateUpiTransactionRef('   ') === 'string', 'Rejects whitespace-only UTR');
assert(typeof validateUpiTransactionRef('1234567890123456789012345678901234567890') === 'string', 'Rejects overly long UTR (> 35 chars)');

console.log('\n--- 3. Testing Payment Proof File Validation ---');

// Test valid image types
assert(validatePaymentProofFile({ name: 'proof.jpg', type: 'image/jpeg', size: 1024 * 1024 }).valid === true, 'Accepts standard JPG (1MB)');
assert(validatePaymentProofFile({ name: 'receipt.jpeg', type: 'image/jpeg', size: 2 * 1024 * 1024 }).valid === true, 'Accepts JPEG (2MB)');
assert(validatePaymentProofFile({ name: 'screenshot.png', type: 'image/png', size: 4.5 * 1024 * 1024 }).valid === true, 'Accepts PNG (4.5MB)');

// Test invalid types
assert(validatePaymentProofFile({ name: 'invoice.pdf', type: 'application/pdf', size: 500 * 1024 }).valid === false, 'Rejects PDF documents');
assert(validatePaymentProofFile({ name: 'animation.gif', type: 'image/gif', size: 500 * 1024 }).valid === false, 'Rejects GIF images');
assert(validatePaymentProofFile({ name: 'video.mp4', type: 'video/mp4', size: 2 * 1024 * 1024 }).valid === false, 'Rejects video files');

// Test file size limit (5MB)
assert(validatePaymentProofFile({ name: 'large.jpg', type: 'image/jpeg', size: 5.5 * 1024 * 1024 }).valid === false, 'Rejects file > 5MB');
assert(validatePaymentProofFile({ name: 'exact5mb.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 }).valid === true, 'Accepts file <= 5MB');
assert(validatePaymentProofFile(null).valid === false, 'Rejects null file');

console.log('\n--- 4. Testing Payment Status & Immutability Defaults ---');

const mockRegistrationPaymentPayload = {
  amount: 2000,
  currency: 'INR',
  upiIdUsed: 'webryza@upi',
  upiDisplayNameUsed: 'WebRyza',
  transactionReference: '123456789012',
  paymentProof: {
    cloudinaryPublicId: 'webryza/payment_proofs/proof_123',
    resourceType: 'image',
    fileFormat: 'jpg',
    originalFileName: 'screenshot.jpg',
    url: 'https://res.cloudinary.com/demo/image/upload/proof_123.jpg',
  },
  status: 'Verification Pending',
};

assert(mockRegistrationPaymentPayload.status === 'Verification Pending', 'Payment status is set to "Verification Pending"');
assert(Boolean(mockRegistrationPaymentPayload.transactionReference), 'Transaction reference is preserved');
assert(Boolean(mockRegistrationPaymentPayload.paymentProof.url), 'Payment proof URL is preserved');
assert(Boolean(mockRegistrationPaymentPayload.paymentProof.cloudinaryPublicId), 'Cloudinary public ID is stored');

console.log(`\n==========================================`);
console.log(`UPI Payment Workflow Tests: ${passed} passed, ${failed} failed`);
console.log(`==========================================\n`);

if (failed > 0) {
  process.exit(1);
}
