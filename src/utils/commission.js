/**
 * WebRyza Commission Business Rules
 *
 * Rules:
 * - Minimum amountCharged is ₹1,500.
 * - If amountCharged < 2,000: webryzaShare = ₹1,000
 * - If amountCharged >= 2,000: webryzaShare = ₹1,500
 * - For partner registrations: partnerCommission = amountCharged - webryzaShare
 * - For direct registrations: partnerCommission = 0
 * - amountDueToWebryza = webryzaShare
 * - amountReceivedByWebryza = 0
 */

export const MINIMUM_REGISTRATION_AMOUNT = 1500;

export function calculateCommissions(amountCharged, isPartner = false) {
  const amount = Number(amountCharged);

  if (isNaN(amount) || amount < MINIMUM_REGISTRATION_AMOUNT) {
    throw new Error(`Amount must be at least ₹${MINIMUM_REGISTRATION_AMOUNT.toLocaleString('en-IN')}`);
  }

  // Tiered WebRyza share
  const webryzaShare = amount < 2000 ? 1000 : 1500;

  // Partner commission calculation
  const partnerCommission = isPartner ? Math.max(0, amount - webryzaShare) : 0;

  const amountDueToWebryza = webryzaShare;
  const amountReceivedByWebryza = 0;

  return {
    amountCharged: amount,
    webryzaShare,
    partnerCommission,
    amountDueToWebryza,
    amountReceivedByWebryza,
  };
}
