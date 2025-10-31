/**
 * Represents a single increment in a time pattern.
 * Can be either:
 * - A number: minutes to add from the previous entry
 * - An object: minutes to add relative to a specific entry index
 */
export type IncrementPattern =
  | number // Direct increment in minutes from previous entry
  | { relativeTo: number; add: number }; // Add X minutes to entry at index Y (0-based)

export interface TimeRange {
  id: string; // Unique identifier
  startTime: string; // "10:00"
  incrementPattern: IncrementPattern[]; // Pattern of increments (length = photoCount - 1)
  photoCount: number; // Number of photos assigned to this range
}

export interface WatermarkConfig {
  date: string; // "2025-01-15"
  street: string; // "123 N. MAIN ST."
  city: string; // "CAMBRIDGE"
  state: string; // "MA"
  zip: string; // "02138"
  timeRanges: TimeRange[]; // Available time ranges with photo counts
}

export interface AdvancedOptions {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  fontSize: "small" | "medium" | "large";
  textColor: "white" | "black";
}

export interface ProcessingProgress {
  current: number;
  total: number;
  currentFile: string;
}
