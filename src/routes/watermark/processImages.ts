import type {
  WatermarkConfig,
  AdvancedOptions,
  ProcessingProgress,
} from "./types";

/**
 * Process multiple images with watermarks
 */
export async function processImages(
  files: File[],
  config: WatermarkConfig,
  options: AdvancedOptions,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<Blob[]> {
  const processed: Blob[] = [];

  for (let i = 0; i < files.length; i++) {
    onProgress?.({
      current: i + 1,
      total: files.length,
      currentFile: files[i].name,
    });

    const blob = await processImage(files[i], config, options, i);
    processed.push(blob);
  }

  return processed;
}

/**
 * Process a single image with watermark
 */
async function processImage(
  file: File,
  config: WatermarkConfig,
  options: AdvancedOptions,
  index: number
): Promise<Blob> {
  // Load image to canvas
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Calculate timestamp for this image based on assignments
  const timestamp = calculateTimestampFromRanges(config, index);

  // Convert date from YYYY-MM-DD to MM/DD/YYYY
  const [year, month, day] = config.date.split("-");
  const dateStr = `${month}/${day}/${year}`;

  // Generate multi-line watermark text (convert address to uppercase)
  const watermarkLines = [
    `${dateStr} ${timestamp}`,
    config.street.toUpperCase(),
    `${config.city.toUpperCase()}, ${config.state.toUpperCase()} ${config.zip}`,
  ];

  // Apply watermark
  applyWatermark(ctx, watermarkLines, canvas.width, canvas.height, options);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      "image/jpeg",
      0.92
    );
  });
}

/**
 * Calculate timestamp for image based on assignments
 */
function calculateTimestampFromRanges(
  config: import("./types").WatermarkConfig,
  imageIndex: number
): string {
  // Find assignment for this image
  const assignment = config.assignments.find(
    (a) => a.imageIndex === imageIndex
  );
  if (!assignment) {
    return "12:00PM"; // Fallback for unassigned images
  }

  // Find the range
  const range = config.timeRanges.find((r) => r.id === assignment.rangeId);
  if (!range) {
    return "12:00PM"; // Fallback for invalid range
  }

  // Find position within range (sorted by image index)
  const imagesInRange = config.assignments
    .filter((a) => a.rangeId === assignment.rangeId)
    .sort((a, b) => a.imageIndex - b.imageIndex);

  const positionInRange = imagesInRange.findIndex(
    (a) => a.imageIndex === imageIndex
  );

  return calculateTimestamp(
    range.startTime,
    range.incrementMinutes,
    positionInRange
  );
}

/**
 * Calculate timestamp for a single image within a range
 */
function calculateTimestamp(
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
 * Apply multi-line watermark text to canvas
 */
function applyWatermark(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  width: number,
  height: number,
  options: AdvancedOptions
): void {
  // Font size mapping based on image height
  const fontSizes = {
    small: Math.floor(height * 0.025),
    medium: Math.floor(height * 0.035),
    large: Math.floor(height * 0.045),
  };

  const fontSize = fontSizes[options.fontSize];
  const lineHeight = fontSize * 1.2;

  // Configure text style
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = "top";

  // Measure the widest line to determine positioning
  const lineWidths = lines.map((line) => ctx.measureText(line).width);
  const maxWidth = Math.max(...lineWidths);
  const totalHeight = lineHeight * lines.length;
  const padding = fontSize * 0.8;

  // Calculate starting position based on corner
  let startX: number;
  let startY: number;

  if (options.position.includes("right")) {
    startX = width - maxWidth - padding;
  } else {
    startX = padding;
  }

  if (options.position.includes("bottom")) {
    startY = height - totalHeight - padding;
  } else {
    startY = padding;
  }

  // Draw each line
  const fillStyle =
    options.textColor === "white"
      ? "rgba(255,255,255,0.95)"
      : "rgba(0,0,0,0.9)";

  ctx.fillStyle = fillStyle;

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;

    // Draw text
    ctx.fillText(line, startX, y);
  });
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate files before processing
 */
export function validateFiles(files: File[]): string | null {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const maxCount = 100;

  if (files.length === 0) return "Please select at least one image";
  if (files.length > maxCount) return `Maximum ${maxCount} images allowed`;

  const oversized = files.find((f) => f.size > maxSize);
  if (oversized) return `File "${oversized.name}" is too large (max 20MB)`;

  // Check if all files are images
  const nonImage = files.find((f) => !f.type.startsWith("image/"));
  if (nonImage) return `File "${nonImage.name}" is not an image`;

  return null;
}

/**
 * Validate watermark configuration
 */
export function validateConfig(
  config: WatermarkConfig,
  totalImages: number = 0
): string | null {
  if (!config.date) return "Date is required";
  if (!config.street.trim()) return "Street address is required";
  if (!config.city.trim()) return "City is required";
  if (!config.state.trim()) return "State is required";
  if (!config.zip.trim()) return "ZIP code is required";

  if (config.timeRanges.length === 0)
    return "At least one time range is required";

  for (let i = 0; i < config.timeRanges.length; i++) {
    const range = config.timeRanges[i];
    if (!range.startTime) return `Range ${i + 1}: Start time is required`;
    if (range.incrementMinutes < 1)
      return `Range ${i + 1}: Increment must be at least 1 minute`;
  }

  // Validate all images are assigned
  if (totalImages > 0) {
    const totalAssigned = config.assignments.length;
    if (totalAssigned !== totalImages) {
      return `All images must be assigned to a time range (${totalAssigned}/${totalImages} assigned)`;
    }

    // Validate all assignments reference valid ranges
    const validRangeIds = new Set(config.timeRanges.map((r) => r.id));
    const invalidAssignment = config.assignments.find(
      (a) => !validRangeIds.has(a.rangeId)
    );
    if (invalidAssignment) {
      return "Some images are assigned to invalid time ranges";
    }
  }

  return null;
}
