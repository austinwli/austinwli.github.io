import type { WatermarkConfig, TimeRange } from "./types";

/**
 * Calculate timestamp for an image based on its assignment
 */
export function calculateImageTimestamp(
  config: WatermarkConfig,
  imageIndex: number
): string | null {
  // Find assignment for this image
  const assignment = config.assignments.find(
    (a) => a.imageIndex === imageIndex
  );
  if (!assignment) return null;

  // Find the range
  const range = config.timeRanges.find((r) => r.id === assignment.rangeId);
  if (!range) return null;

  // Find position within range (sorted by image index)
  const imagesInRange = config.assignments
    .filter((a) => a.rangeId === assignment.rangeId)
    .sort((a, b) => a.imageIndex - b.imageIndex);

  const positionInRange = imagesInRange.findIndex(
    (a) => a.imageIndex === imageIndex
  );

  return formatTimestamp(
    range.startTime,
    range.incrementMinutes,
    positionInRange
  );
}

/**
 * Format timestamp for a position within a time range
 */
export function formatTimestamp(
  startTime: string,
  incrementMinutes: number,
  index: number
): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + index * incrementMinutes;

  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  // Format as 12-hour time with AM/PM (no space before AM/PM)
  const period = newHours >= 12 ? "PM" : "AM";
  const displayHours = newHours % 12 || 12;

  return `${displayHours}:${String(newMinutes).padStart(2, "0")}${period}`;
}

/**
 * Get the display name for a range
 */
export function getRangeName(timeRanges: TimeRange[], rangeId: string): string {
  const rangeIndex = timeRanges.findIndex((r) => r.id === rangeId);
  return rangeIndex >= 0 ? `Range ${rangeIndex + 1}` : "Unknown";
}
