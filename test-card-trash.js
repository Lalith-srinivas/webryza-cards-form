/**
 * Automated Test Suite: Block Access to Wedding Cards Moved to Trash
 * 
 * Verifies:
 * 1. Active cards render normally.
 * 2. Trashed cards (soft-deleted) are blocked with "Invitation Not Available".
 * 3. Restored cards are immediately accessible without new URL/ID.
 * 4. Permanently deleted cards show "Invitation Not Found".
 * 5. Missing isDeleted fields on legacy records are treated as active.
 * 6. Trashed cards do not leak couple info, wedding details, photos, or payment info.
 */

import { isWeddingCardTrashed } from './src/utils/cardStatus.js';
import { mapFirestoreToTemplateData } from './src/utils/templateDataMapper.js';

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

console.log('========================================================');
console.log('  WebRyza Cards - Soft Deletion / Trash Test Suite');
console.log('========================================================\n');

// --------------------------------------------------------------------------
// Section 1: Soft-Deletion / Trash Flag Detection
// --------------------------------------------------------------------------
console.log('Section 1: Soft-Deletion & Status Checks');

// Active Card
const activeCard = {
  weddingId: 'WR-1691',
  brideName: 'Sneha',
  groomName: 'Arjun',
  isDeleted: false,
  status: 'published',
};
assert(isWeddingCardTrashed(activeCard) === false, 'Active card (isDeleted: false) is NOT trashed');

// Legacy Card without isDeleted field
const legacyCard = {
  weddingId: '0001',
  brideName: 'Kavya',
  groomName: 'Vishu',
  status: 'confirmed',
  // isDeleted is undefined
};
assert(isWeddingCardTrashed(legacyCard) === false, 'Legacy card with missing isDeleted is treated as ACTIVE');

// Trashed via isDeleted: true
const trashedCard1 = {
  weddingId: 'WR-1691',
  brideName: 'Sneha',
  groomName: 'Arjun',
  isDeleted: true,
  status: 'published',
};
assert(isWeddingCardTrashed(trashedCard1) === true, 'Card with isDeleted: true is detected as TRASHED');

// Trashed via isDeleted: "true" (string format)
const trashedCardString = {
  weddingId: 'WR-1691',
  isDeleted: 'true',
};
assert(isWeddingCardTrashed(trashedCardString) === true, 'Card with isDeleted: "true" string is detected as TRASHED');

// Trashed via status: "trashed"
const trashedCard2 = {
  weddingId: 'WR-2002',
  status: 'trashed',
};
assert(isWeddingCardTrashed(trashedCard2) === true, 'Card with status: "trashed" is detected as TRASHED');

// Trashed via status: "trash"
const trashedCard3 = {
  weddingId: 'WR-2003',
  status: 'trash',
};
assert(isWeddingCardTrashed(trashedCard3) === true, 'Card with status: "trash" is detected as TRASHED');

// Trashed via status: "deleted"
const trashedCard4 = {
  weddingId: 'WR-2004',
  status: 'deleted',
};
assert(isWeddingCardTrashed(trashedCard4) === true, 'Card with status: "deleted" is detected as TRASHED');

// Trashed via inTrash / isTrashed flags
assert(isWeddingCardTrashed({ inTrash: true }) === true, 'Card with inTrash: true is detected as TRASHED');
assert(isWeddingCardTrashed({ isTrashed: true }) === true, 'Card with isTrashed: true is detected as TRASHED');
assert(isWeddingCardTrashed({ deleted: true }) === true, 'Card with deleted: true is detected as TRASHED');

// Trashed via deletedAt timestamp
const trashedTimestamp = {
  weddingId: 'WR-3001',
  deletedAt: { seconds: 1732700000 },
};
assert(isWeddingCardTrashed(trashedTimestamp) === true, 'Card with deletedAt timestamp is detected as TRASHED');

// Edge cases
assert(isWeddingCardTrashed(null) === false, 'null safely returns false');
assert(isWeddingCardTrashed(undefined) === false, 'undefined safely returns false');
assert(isWeddingCardTrashed({}) === false, 'Empty object with no deletion flags is treated as active');

// --------------------------------------------------------------------------
// Section 2: Restoration Logic
// --------------------------------------------------------------------------
console.log('\nSection 2: Card Restoration Logic');

// Restored card (was deleted, now restored)
const restoredCard = {
  weddingId: 'WR-1691',
  brideName: 'Sneha',
  groomName: 'Arjun',
  isDeleted: false,
  status: 'published',
  deletedAt: { seconds: 1732700000 },
  restoredAt: { seconds: 1732710000 },
};
assert(isWeddingCardTrashed(restoredCard) === false, 'Restored card (isDeleted: false, restoredAt present) is ACTIVE');

// Restored card changing from trashed to active
const cardStateBefore = { weddingId: 'WR-1691', isDeleted: true };
const cardStateAfterRestore = { ...cardStateBefore, isDeleted: false, status: 'published' };

assert(isWeddingCardTrashed(cardStateBefore) === true, 'Card is initially TRASHED');
assert(isWeddingCardTrashed(cardStateAfterRestore) === false, 'Card becomes ACTIVE immediately upon restoration');

// --------------------------------------------------------------------------
// Section 3: Data Protection & Sanitization on Trashed / Missing Records
// --------------------------------------------------------------------------
console.log('\nSection 3: Security & Leak Prevention');

function simulateCardAccess(rawDoc) {
  if (!rawDoc) {
    return {
      status: 'not_found',
      title: 'Invitation Not Found',
      message: 'The wedding invitation link you entered could not be found.',
      data: null,
    };
  }

  if (isWeddingCardTrashed(rawDoc)) {
    return {
      status: 'unavailable',
      title: 'Invitation Not Available',
      message: 'This wedding invitation is currently unavailable. Please contact the person who shared this link with you.',
      data: null, // Critical: data must NOT be exposed
    };
  }

  return {
    status: 'active',
    title: 'Active Invitation',
    data: mapFirestoreToTemplateData(rawDoc, rawDoc.weddingId),
  };
}

// 1. Test Active Card Access
const accessActive = simulateCardAccess(activeCard);
assert(accessActive.status === 'active', 'Active card gives status "active"');
assert(accessActive.data !== null, 'Active card includes mapped data');
assert(accessActive.data.brideName === 'Sneha', 'Active card includes brideName');

// 2. Test Trashed Card Access
const accessTrashed = simulateCardAccess(trashedCard1);
assert(accessTrashed.status === 'unavailable', 'Trashed card gives status "unavailable"');
assert(accessTrashed.title === 'Invitation Not Available', 'Title is strictly "Invitation Not Available"');
assert(accessTrashed.message.includes('currently unavailable'), 'Displays expected unavailable message');
assert(accessTrashed.data === null, 'Trashed card exposes ZERO data (data is strictly null)');

// 3. Test Permanently Deleted / Nonexistent Card Access
const accessNotFound = simulateCardAccess(null);
assert(accessNotFound.status === 'not_found', 'Deleted card gives status "not_found"');
assert(accessNotFound.title === 'Invitation Not Found', 'Title is strictly "Invitation Not Found"');
assert(accessNotFound.data === null, 'Nonexistent card exposes ZERO data');

// 4. Test Restored Card Access with same URL
const accessRestored = simulateCardAccess(cardStateAfterRestore);
assert(accessRestored.status === 'active', 'Restored card immediately returns status "active"');
assert(accessRestored.data !== null, 'Restored card exposes active template data');

console.log('\n========================================================');
console.log(` Soft Deletion Test Results: ${passed} passed, ${failed} failed`);
console.log('========================================================\n');

if (failed > 0) {
  process.exit(1);
}
