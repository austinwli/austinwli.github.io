import type { AspectRatio, CropRect, ImageAdjustment } from "./types";

const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "1:1": 1,
};

export const MIN_CROP_SIZE = 0.05;

export const DEFAULT_IMAGE_ADJUSTMENT: ImageAdjustment = {
  rotation: 0,
  aspectRatio: "4:3",
  crop: getDefaultCrop("4:3"),
};

export function getAspectRatioValue(aspectRatio: AspectRatio): number {
  return ASPECT_RATIO_VALUES[aspectRatio] ?? 4 / 3;
}

export function getDefaultCrop(
  aspectRatio: AspectRatio,
  imageAspectRatio = 1
): CropRect {
  const ratio = getAspectRatioValue(aspectRatio);
  const normalizedRatio = ratio * imageAspectRatio;

  let width: number;
  let height: number;

  if (normalizedRatio >= 1) {
    height = 1;
    width = Math.min(1, normalizedRatio);
  } else {
    width = 1;
    height = Math.min(1, 1 / normalizedRatio);
  }

  const x = Math.max(0, (1 - width) / 2);
  const y = Math.max(0, (1 - height) / 2);

  return clampCrop({
    x,
    y,
    width,
    height,
  });
}

export function normalizeCrop(
  crop: CropRect | undefined,
  aspectRatio: AspectRatio,
  imageAspectRatio = 1
): CropRect {
  if (!crop) {
    return getDefaultCrop(aspectRatio, imageAspectRatio);
  }

  const ratio = getAspectRatioValue(aspectRatio);
  const normalizedRatio = ratio * imageAspectRatio;

  let { x, y, width, height } = crop;

  width = Math.max(width, MIN_CROP_SIZE);
  height = Math.max(height, MIN_CROP_SIZE);

  const desiredWidth = height * normalizedRatio;
  const desiredHeight = width / normalizedRatio;

  if (desiredWidth <= 1) {
    width = desiredWidth;
  } else {
    height = Math.min(desiredHeight, 1);
    width = height * normalizedRatio;
  }

  width = Math.min(width, 1);
  height = Math.min(height, 1);

  ({ x, y } = clampPosition({ x, y }, width, height));

  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampPosition(
  position: { x: number; y: number },
  width: number,
  height: number
) {
  return {
    x: clamp(position.x, 0, 1 - width),
    y: clamp(position.y, 0, 1 - height),
  };
}

function clampCrop(crop: CropRect): CropRect {
  const width = clamp(crop.width, MIN_CROP_SIZE, 1);
  const height = clamp(crop.height, MIN_CROP_SIZE, 1);
  const { x, y } = clampPosition({ x: crop.x, y: crop.y }, width, height);
  return { x, y, width, height };
}

/**
 * Clone an adjustment object to avoid shared references
 */
export function cloneAdjustment(
  adjustment: ImageAdjustment = DEFAULT_IMAGE_ADJUSTMENT
): ImageAdjustment {
  return {
    rotation: adjustment.rotation,
    aspectRatio: adjustment.aspectRatio,
    crop: adjustment.crop ? { ...adjustment.crop } : undefined,
  };
}

/**
 * Apply rotation and aspect-ratio crop to an image, returning a canvas that
 * contains only the adjusted pixels. Zoom is implemented as an additional crop.
 */
export function applyImageAdjustmentsToCanvas(
  image: HTMLImageElement,
  adjustment?: ImageAdjustment
): HTMLCanvasElement {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  const rotation = adjustment?.rotation ?? 0;
  const aspectRatio = adjustment?.aspectRatio ?? "4:3";

  // Step 1: rotate the source into a temporary canvas
  const rotatedCanvas = document.createElement("canvas");
  const rotate90 = rotation === 90 || rotation === 270;

  rotatedCanvas.width = rotate90 ? sourceHeight : sourceWidth;
  rotatedCanvas.height = rotate90 ? sourceWidth : sourceHeight;

  const imageAspectRatio = rotatedCanvas.height / rotatedCanvas.width || 1;
  const cropRect = normalizeCrop(
    adjustment?.crop,
    aspectRatio,
    imageAspectRatio
  );

  const rctx = rotatedCanvas.getContext("2d");
  if (!rctx) {
    throw new Error("Could not create rotation canvas context");
  }

  rctx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
  rctx.rotate((rotation * Math.PI) / 180);
  rctx.drawImage(
    image,
    -sourceWidth / 2,
    -sourceHeight / 2,
    sourceWidth,
    sourceHeight
  );

  // Step 2: crop based on normalized rectangle
  const cropWidthPx = Math.max(
    1,
    Math.round(rotatedCanvas.width * cropRect.width)
  );
  const cropHeightPx = Math.max(
    1,
    Math.round(rotatedCanvas.height * cropRect.height)
  );
  const cropXPx = Math.round(rotatedCanvas.width * cropRect.x);
  const cropYPx = Math.round(rotatedCanvas.height * cropRect.y);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = cropWidthPx;
  outputCanvas.height = cropHeightPx;

  const octx = outputCanvas.getContext("2d");
  if (!octx) {
    throw new Error("Could not create output canvas context");
  }

  octx.drawImage(
    rotatedCanvas,
    cropXPx,
    cropYPx,
    cropWidthPx,
    cropHeightPx,
    0,
    0,
    outputCanvas.width,
    outputCanvas.height
  );

  return outputCanvas;
}

export function rotateImageToCanvas(
  image: HTMLImageElement,
  rotation: 0 | 90 | 180 | 270
): HTMLCanvasElement {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const rotate90 = rotation === 90 || rotation === 270;

  const canvas = document.createElement("canvas");
  canvas.width = rotate90 ? sourceHeight : sourceWidth;
  canvas.height = rotate90 ? sourceWidth : sourceHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create rotation canvas context");
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(
    image,
    -sourceWidth / 2,
    -sourceHeight / 2,
    sourceWidth,
    sourceHeight
  );

  return canvas;
}
