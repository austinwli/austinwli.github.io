export interface TimeRange {
  id: string; // Unique identifier
  startTime: string; // "10:00"
  incrementMinutes: number; // 2
}

export interface ImageAssignment {
  imageIndex: number; // Index in files array
  rangeId: string; // Which time range this image belongs to
}

export interface WatermarkConfig {
  date: string; // "2025-01-15"
  street: string; // "123 N. MAIN ST."
  city: string; // "CAMBRIDGE"
  state: string; // "MA"
  zip: string; // "02138"
  timeRanges: TimeRange[]; // Available time ranges
  assignments: ImageAssignment[]; // Image to range mappings
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
