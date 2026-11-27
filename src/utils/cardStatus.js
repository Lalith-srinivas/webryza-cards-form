/**
 * WebRyza Wedding Card Status & Soft-Deletion Detection Utility
 * 
 * Rules:
 * - Missing isDeleted fields in older records must be treated as active (false).
 * - Soft-deleted / trashed cards in `wedding_cards` are marked via:
 *   - `isDeleted: true`
 *   - `isTrashed: true`
 *   - `inTrash: true`
 *   - `status: "trashed"` | `"trash"` | `"deleted"`
 *   - `deletedAt: <timestamp>` (without restoration)
 * - Restored cards have `isDeleted: false` or active status without deletion flags.
 */

export function isWeddingCardTrashed(data) {
  if (!data || typeof data !== "object") return false;

  // 1. Explicit boolean or truthy string flag
  if (data.isDeleted === true || data.isDeleted === "true") return true;
  if (data.isTrashed === true || data.isTrashed === "true") return true;
  if (data.inTrash === true || data.inTrash === "true") return true;
  if (data.deleted === true || data.deleted === "true") return true;

  // 2. Explicitly restored flag overrides any stale timestamp
  if (
    data.isDeleted === false ||
    data.isTrashed === false ||
    data.inTrash === false ||
    data.deleted === false
  ) {
    // If explicitly marked false, it's active unless status is explicitly "trashed"
    const statusStr = String(data.status || "").toLowerCase().trim();
    if (statusStr === "trashed" || statusStr === "trash" || statusStr === "deleted") {
      return true;
    }
    return false;
  }

  // 3. Status checks (case-insensitive)
  const statusStr = String(data.status || "").toLowerCase().trim();
  const projectStatusStr = String(data.projectStatus || "").toLowerCase().trim();
  const websiteStatusStr = String(data.websiteStatus || "").toLowerCase().trim();

  if (["trashed", "trash", "deleted"].includes(statusStr)) return true;
  if (["trashed", "trash", "deleted"].includes(projectStatusStr)) return true;
  if (["trashed", "trash", "deleted"].includes(websiteStatusStr)) return true;

  // 4. Timestamp presence (if deletedAt exists and not restoredAt)
  if (data.deletedAt && !data.restoredAt) return true;
  if (data.trashedAt && !data.restoredAt) return true;

  // Missing isDeleted fields in old records must be treated as active
  return false;
}
