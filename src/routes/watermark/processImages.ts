import type {
  WatermarkConfig,
  AdvancedOptions,
  ProcessingProgress,
  ImageAdjustment,
} from "./types";
import { calculateImageTimestamp } from "./utils";
import { applyImageAdjustmentsToCanvas } from "./imageTransforms";

/**
 * Check if Alibaba Sans Medium font is loaded, wait if necessary
 */
async function ensureFontLoaded(): Promise<void> {
  const fontName = "Alibaba Sans Medium";

  // Check if FontFace API is available
  if (!document.fonts || !document.fonts.check) {
    // Fallback: wait a bit for font to load
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  }

  // Check if font is already loaded
  try {
    const isLoaded = document.fonts.check(`12px "${fontName}"`);
    if (isLoaded) {
      return;
    }

    // Wait for font to load (max 5 seconds)
    const maxWaitTime = 5000;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkFont = () => {
        const elapsed = Date.now() - startTime;

        if (document.fonts.check(`12px "${fontName}"`)) {
          resolve();
          return;
        }

        if (elapsed > maxWaitTime) {
          console.warn(
            `Font "${fontName}" did not load within ${maxWaitTime}ms, proceeding anyway`
          );
          resolve(); // Proceed even if font didn't load
          return;
        }

        requestAnimationFrame(checkFont);
      };

      // Also listen for font loading events
      document.fonts.ready
        .then(() => {
          if (document.fonts.check(`12px "${fontName}"`)) {
            resolve();
          } else {
            checkFont();
          }
        })
        .catch(() => {
          // If fonts.ready fails, just check manually
          checkFont();
        });

      // Start checking immediately
      checkFont();
    });
  } catch (error) {
    console.warn(`Error checking font "${fontName}":`, error);
    // Fallback: wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

/**
 * Process multiple images with watermarks
 */
export async function processImages(
  files: File[],
  config: WatermarkConfig,
  options: AdvancedOptions,
  onProgress?: (progress: ProcessingProgress) => void,
  adjustments: ImageAdjustment[] = []
): Promise<Blob[]> {
  // Ensure font is loaded before processing
  await ensureFontLoaded();

  const processed: Blob[] = [];

  for (let i = 0; i < files.length; i++) {
    onProgress?.({
      current: i + 1,
      total: files.length,
      currentFile: files[i].name,
    });

    const blob = await processImage(
      files[i],
      config,
      options,
      i,
      adjustments[i]
    );
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
  index: number,
  adjustment?: ImageAdjustment
): Promise<Blob> {
  // Load image
  const img = await loadImage(file);
  const sourceCanvas = applyImageAdjustmentsToCanvas(img, adjustment);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: false, // No transparency for JPEG
    desynchronized: false, // Consistent rendering
  });

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Normalize ALL images to a standard dimension for consistent watermark sizing
  // This ensures all images are processed at the same resolution, making watermarks identical
  const STANDARD_DIMENSION = 3000;
  const aspectRatio = sourceCanvas.width / sourceCanvas.height;

  let targetWidth: number;
  let targetHeight: number;

  if (sourceCanvas.width > sourceCanvas.height) {
    // Landscape: normalize to standard width
    targetWidth = STANDARD_DIMENSION;
    targetHeight = Math.floor(targetWidth / aspectRatio);
  } else {
    // Portrait or square: normalize to standard height
    targetHeight = STANDARD_DIMENSION;
    targetWidth = Math.floor(targetHeight * aspectRatio);
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Set high-quality rendering for consistent output
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw resized image
  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  // Calculate timestamp for this image based on assignments
  const timestamp = calculateImageTimestamp(config, index) || "12:00PM";

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
  applyWatermark(ctx, watermarkLines, targetWidth, targetHeight, options);

  // Convert to blob with consistent quality
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
 * Apply multi-line watermark text to canvas
 */
function applyWatermark(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  width: number,
  height: number,
  options: AdvancedOptions
): void {
  // Font size mapping based on STANDARD dimension (not actual image height)
  // Since all images are normalized to 3000px on longest side, font size is consistent
  // This ensures watermarks look identical across all images regardless of source quality
  const STANDARD_HEIGHT = 3000;
  const fontSizes = {
    small: Math.floor(STANDARD_HEIGHT * 0.025),
    medium: Math.floor(STANDARD_HEIGHT * 0.035),
    large: Math.floor(STANDARD_HEIGHT * 0.045),
  };

  const fontSize = fontSizes[options.fontSize];

  // Adjust leading: original was fontSize * 1.2, now reduce by 10
  const baseLineHeight = fontSize * 1.2;
  const lineHeight = Math.max(baseLineHeight - 10, fontSize * 0.8); // Minimum 0.8x to prevent overlap

  // Use Alibaba Sans Bold or Medium font based on bold option
  const fontFamily = options.bold
    ? '"Alibaba Sans Bold", "Alibaba Sans Medium", "Alibaba Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    : '"Alibaba Sans Medium", "Alibaba Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.font = `${fontSize}px ${fontFamily}`;
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

  // Border width mapping - relative to font size for consistent visibility
  // This ensures borders scale proportionally with text size
  const borderWidths = {
    thin: Math.max(1, Math.floor(fontSize * 0.05)),
    medium: Math.max(2, Math.floor(fontSize * 0.08)),
    thick: Math.max(3, Math.floor(fontSize * 0.12)),
  };

  // Draw each line with pixel-perfect rendering
  lines.forEach((line, i) => {
    // Round coordinates for pixel-perfect rendering (prevents blurry text)
    const y = Math.round(startY + i * lineHeight);
    const x = Math.round(startX);

    // Draw border/outline if enabled
    if (options.hasBorder) {
      const borderWidth = borderWidths[options.borderWidth];
      ctx.strokeStyle =
        options.borderColor === "white"
          ? "rgba(255,255,255,0.95)"
          : options.borderColor === "black"
          ? "rgba(0,0,0,0.9)"
          : options.borderColor;
      ctx.lineWidth = borderWidth * 2;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(line, x, y);
    }

    // Draw text fill
    ctx.fillStyle =
      options.textColor === "white"
        ? "rgba(255,255,255,0.95)"
        : options.textColor === "black"
        ? "rgba(0,0,0,0.9)"
        : options.textColor;

    ctx.fillText(line, x, y);
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
    if (!range.incrementPattern || !Array.isArray(range.incrementPattern))
      return `Range ${i + 1}: Increment pattern is required`;
    if (range.photoCount < 0)
      return `Range ${i + 1}: Photo count cannot be negative`;
    // Pattern length should be photoCount - 1 (first image uses start time)
    if (
      range.photoCount > 0 &&
      range.incrementPattern.length !== range.photoCount - 1
    ) {
      return `Range ${i + 1}: Pattern length (${
        range.incrementPattern.length
      }) must be ${range.photoCount - 1} for ${range.photoCount} photos`;
    }
    // Validate pattern entries: numbers must be >= 0, relative references must be valid
    for (let j = 0; j < range.incrementPattern.length; j++) {
      const entry = range.incrementPattern[j];
      if (typeof entry === "number") {
        if (entry < 0) {
          return `Range ${i + 1}: Pattern entry ${j + 1} cannot be negative`;
        }
      } else if (typeof entry === "object" && entry !== null) {
        if (
          typeof entry.relativeTo !== "number" ||
          typeof entry.add !== "number"
        ) {
          return `Range ${i + 1}: Pattern entry ${
            j + 1
          } has invalid relative reference format`;
        }
        // At pattern position j, we have computed times[0] through times[j]
        // relativeTo can reference any already-computed time (0 <= relativeTo <= j)
        if (entry.relativeTo < 0 || entry.relativeTo > j) {
          return `Range ${i + 1}: Pattern entry ${
            j + 1
          } references invalid index (must reference an already-computed entry)`;
        }
        if (entry.add < 0) {
          return `Range ${i + 1}: Pattern entry ${
            j + 1
          } has negative add value`;
        }
      } else {
        return `Range ${i + 1}: Pattern entry ${j + 1} has invalid format`;
      }
    }
  }

  // Validate total photo count matches uploaded images
  if (totalImages > 0) {
    const totalAssigned = config.timeRanges.reduce(
      (sum, range) => sum + range.photoCount,
      0
    );
    if (totalAssigned !== totalImages) {
      return `Total photos in ranges (${totalAssigned}) must equal uploaded images (${totalImages})`;
    }
  }

  return null;
}
