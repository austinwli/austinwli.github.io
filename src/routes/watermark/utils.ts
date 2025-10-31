import type { WatermarkConfig, TimeRange, IncrementPattern } from "./types";

/**
 * Default increment patterns for the four ranges.
 * Each pattern array has length (photoCount - 1) since the first image uses the start time.
 */
export const DEFAULT_PATTERNS: IncrementPattern[][] = [
  // Range 1 (18 images): 17 entries
  [2, 1, 1, 2, 0, 1, 0, 1, 0, 10, 4, 4, 1, 5, 16, 17, 3],
  // Range 2 (30 images): 29 entries
  [
    2,
    1,
    1,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    10,
    5,
    4,
    1,
    1,
    1,
    4,
    16,
    16,
    3,
    { relativeTo: 22, add: 2 },
    16,
    17,
    2,
  ],
  // Range 3 (42 images): 41 entries
  [
    2,
    1,
    1,
    1,
    0,
    0,
    1,
    0,
    0,
    2,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    10,
    5,
    5,
    1,
    1,
    1,
    1,
    1,
    { relativeTo: 30, add: 4 },
    16,
    16,
    3,
    { relativeTo: 30, add: 3 },
    18,
    16,
    2,
    { relativeTo: 30, add: 2 },
    17,
    16,
    3,
  ],
  // Range 4 (66 images): 65 entries
  [
    2,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    2,
    0,
    1,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    1,
    0,
    12,
    8,
    4,
    1,
    1,
    1,
    2,
    1,
    1,
    1,
    2,
    1,
    4,
    16,
    16,
    3,
    { relativeTo: 46, add: 3 },
    18,
    16,
    2,
    { relativeTo: 50, add: 2 },
    17,
    16,
    3,
    { relativeTo: 54, add: 40 },
    16,
    17,
    2,
    { relativeTo: 58, add: 3 },
    17,
    17,
    2,
  ],
];

/**
 * Default photo counts for the four ranges
 */
export const DEFAULT_PHOTO_COUNTS = [18, 30, 42, 66];

/**
 * Calculate timestamp for an image based on pattern-based assignment.
 * Images are assigned to ranges in upload order based on photoCount.
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
      return calculateTimestampFromPattern(
        range.startTime,
        range.incrementPattern,
        positionInRange
      );
    }

    cumulativeCount = rangeEndIndex;
  }

  // Image index exceeds total assigned photos
  return null;
}

/**
 * Calculate timestamp using increment pattern with support for relative references.
 *
 * @param startTime - Start time in "HH:MM" format (24-hour)
 * @param pattern - Array of increment patterns (length should be photoCount - 1)
 * @param positionInRange - 0-based position within the range (0 = start time)
 * @returns Formatted timestamp string like "10:15AM"
 */
function calculateTimestampFromPattern(
  startTime: string,
  pattern: IncrementPattern[],
  positionInRange: number
): string {
  // Convert start time to total minutes since midnight
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;

  // Build array of absolute times in minutes
  // times[0] is the start time (positionInRange = 0)
  const times: number[] = [startTotalMinutes];

  // Calculate each subsequent time based on the pattern
  for (let i = 0; i < positionInRange && i < pattern.length; i++) {
    const increment = pattern[i];
    let nextTime: number;

    if (typeof increment === "number") {
      // Direct increment: add minutes from previous entry
      nextTime = times[times.length - 1] + increment;
    } else {
      // Relative reference: add to a specific previous entry
      if (increment.relativeTo < 0 || increment.relativeTo >= times.length) {
        throw new Error(
          `Invalid relative reference: index ${increment.relativeTo} is out of bounds`
        );
      }
      const referenceTime = times[increment.relativeTo];
      nextTime = referenceTime + increment.add;
    }

    times.push(nextTime);
  }

  // Convert final time back to formatted string
  const finalTotalMinutes = times[times.length - 1];
  return formatTimestampFromMinutes(finalTotalMinutes);
}

/**
 * Format minutes since midnight to 12-hour time string.
 *
 * @param totalMinutes - Total minutes since midnight
 * @returns Formatted time like "10:15AM" or "2:05PM"
 */
function formatTimestampFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, "0")}${period}`;
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
