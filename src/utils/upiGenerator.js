/**
 * Generates direct UPI payment intent URI according to National Payments Corporation of India (NPCI) spec:
 * Format: upi://pay?pa=UPI_ID&pn=WebRyza&am=2000&cu=INR&tn=Wedding%20Invitation&tr=WR1691
 * 
 * Parameters:
 * - pa: Payee VPA / UPI ID
 * - pn: Payee Display Name
 * - am: Amount in INR (exact number / string)
 * - cu: Currency code (INR)
 * - tn: Transaction note
 * - tr: Transaction reference / order reference
 */
export function generateUpiUri({
  upiId,
  displayName = "WebRyza",
  amount,
  orderRef = "",
  note = "Wedding Invitation",
}) {
  const cleanUpiId = (upiId || "").trim();
  const cleanDisplayName = (displayName || "WebRyza").trim();
  const cleanAmount = String(amount || "").replace(/[^0-9.]/g, "");
  const cleanOrderRef = (orderRef || "").trim();
  const cleanNote = (note || "Wedding Invitation").trim();

  if (!cleanUpiId || !cleanUpiId.includes("@")) {
    throw new Error("Invalid UPI ID provided for payment URI generation.");
  }

  if (!cleanAmount || Number(cleanAmount) <= 0) {
    throw new Error("Invalid payment amount provided for UPI URI generation.");
  }

  const params = new URLSearchParams();
  params.set("pa", cleanUpiId);
  params.set("pn", cleanDisplayName);
  params.set("am", cleanAmount);
  params.set("cu", "INR");
  params.set("tn", cleanNote);

  if (cleanOrderRef) {
    params.set("tr", cleanOrderRef);
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Validates a customer-entered UPI transaction reference (UTR)
 * Typical Indian banking UTRs are 12 digits, but alphanumeric 6-25 chars can occur
 */
export function validateUpiTransactionRef(ref) {
  const clean = (ref || "").trim();
  if (!clean) {
    return "UPI Transaction Reference Number (UTR) is mandatory.";
  }
  if (clean.length < 6) {
    return "UPI Transaction Reference must be at least 6 characters (e.g. 12-digit UTR).";
  }
  if (clean.length > 35) {
    return "UPI Transaction Reference must not exceed 35 characters.";
  }
  return null;
}
