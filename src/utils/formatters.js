/**
 * Formatting helpers
 */

export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export function formatDatePretty(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
