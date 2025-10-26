import type { WatermarkConfig, TimeRange } from "./types";

/**
 * Calculate timestamp for an image based on sequential assignment
 * Images are assigned to ranges in upload order based on photoCount
 */
export function calculateImageTimestamp(
  config: WatermarkConfig,
  imageIndex: number
): string | null {
  let cumulativeCount = 0;

  // Iterate through ranges to find which one contains this image
  for (const range of config.timeRanges) {
    const rangeEndIndex = cumulativeCount + range.photoCount;

    if (imageIndex < rangeEndIndex) {
      // This image belongs to the current range
      const positionInRange = imageIndex - cumulativeCount;
      return formatTimestamp(
        range.startTime,
        range.incrementMinutes,
        positionInRange
      );
    }

    cumulativeCount = rangeEndIndex;
  }

  // Image index exceeds total assigned photos
  return null;
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
 * Get which range an image belongs to based on sequential assignment
 * Returns range object and position within that range, or null if unassigned
 */
export function getImageRange(
  config: WatermarkConfig,
  imageIndex: number
): { range: TimeRange; rangeIndex: number; positionInRange: number } | null {
  let cumulativeCount = 0;

  for (let i = 0; i < config.timeRanges.length; i++) {
    const range = config.timeRanges[i];
    const rangeEndIndex = cumulativeCount + range.photoCount;

    if (imageIndex < rangeEndIndex) {
      return {
        range,
        rangeIndex: i,
        positionInRange: imageIndex - cumulativeCount,
      };
    }

    cumulativeCount = rangeEndIndex;
  }

  return null;
}
