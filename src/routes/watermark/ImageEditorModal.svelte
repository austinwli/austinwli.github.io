<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { RotateCcw, RotateCw } from "lucide-svelte";
  import type { AspectRatio, CropRect, ImageAdjustment } from "./types";
  import {
    DEFAULT_IMAGE_ADJUSTMENT,
    MIN_CROP_SIZE,
    cloneAdjustment,
    getDefaultCrop,
    getAspectRatioValue,
    normalizeCrop,
    applyImageAdjustmentsToCanvas,
    rotateImageToCanvas,
  } from "./imageTransforms";

  export let file: File;
  export let adjustment: ImageAdjustment = DEFAULT_IMAGE_ADJUSTMENT;

  const dispatch = createEventDispatcher<{
    close: void;
    save: { adjustment: ImageAdjustment; previewUrl?: string | null };
  }>();

  let draft: ImageAdjustment = cloneAdjustment(adjustment);
  let previousAdjustment: ImageAdjustment | null = null;

  let previewUrl = "";
  let rotatedPreviewUrl = "";
  let baseImage: HTMLImageElement | null = null;
  let stageEl: HTMLDivElement | null = null;
  let stageRect: DOMRect | null = null;
  let rotatedDimensions = { width: 4, height: 3 };

  let imageLoadToken = 0;
  let rotationPreviewToken = 0;

  type CornerHandle = "nw" | "ne" | "sw" | "se";
  type DragState =
    | {
        type: "move";
        startX: number;
        startY: number;
        startCrop: CropRect;
      }
    | {
        type: "resize";
        handle: CornerHandle;
        startCrop: CropRect;
      };

  let dragState: DragState | null = null;
  let isSaving = false;

  function getImageAspectRatio() {
    if (rotatedDimensions.width === 0) return 1;
    return rotatedDimensions.height / rotatedDimensions.width;
  }

  function ensureCropMatchesImage() {
    if (dragState || !draft.crop) return;
    const imageRatio = getImageAspectRatio();
    const normalized = normalizeCrop(draft.crop, draft.aspectRatio, imageRatio);

    const epsilon = 0.0001;
    if (
      Math.abs(normalized.x - draft.crop.x) > epsilon ||
      Math.abs(normalized.y - draft.crop.y) > epsilon ||
      Math.abs(normalized.width - draft.crop.width) > epsilon ||
      Math.abs(normalized.height - draft.crop.height) > epsilon
    ) {
      draft = { ...draft, crop: normalized };
    }
  }

  $: if (!draft.crop) {
    draft = {
      ...draft,
      crop: getDefaultCrop(draft.aspectRatio, getImageAspectRatio()),
    };
  }

  $: if (adjustment && adjustment !== previousAdjustment) {
    draft = cloneAdjustment(adjustment);
    if (!draft.crop) {
      draft.crop = getDefaultCrop(draft.aspectRatio, getImageAspectRatio());
    }
    previousAdjustment = adjustment;
  }

  $: if (file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    loadBaseImage(file);
  }

  $: if (baseImage) {
    updateRotatedPreview(draft.rotation);
  }

  async function loadBaseImage(currentFile: File) {
    const token = ++imageLoadToken;
    const img = await loadImage(currentFile);
    if (token !== imageLoadToken) return;
    baseImage = img;
    await updateRotatedPreview(draft.rotation);
    ensureCropMatchesImage();
  }

  async function updateRotatedPreview(rotation: 0 | 90 | 180 | 270) {
    if (!baseImage) return;
    const token = ++rotationPreviewToken;
    const canvas = rotateImageToCanvas(baseImage, rotation);
    if (token !== rotationPreviewToken) return;
    rotatedDimensions = { width: canvas.width, height: canvas.height };
    const url = await canvasToObjectUrl(canvas);
    if (token !== rotationPreviewToken) {
      URL.revokeObjectURL(url);
      return;
    }
    if (rotatedPreviewUrl) {
      URL.revokeObjectURL(rotatedPreviewUrl);
    }
    rotatedPreviewUrl = url;
    ensureCropMatchesImage();
  }

  onDestroy(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (rotatedPreviewUrl) URL.revokeObjectURL(rotatedPreviewUrl);
  });

  function loadImage(sourceFile: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error(`Failed to load image: ${sourceFile.name}`));
      };
      img.src = URL.createObjectURL(sourceFile);
    });
  }

  function canvasToObjectUrl(canvas: HTMLCanvasElement): Promise<string> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error("Failed to create preview"));
          }
        },
        "image/jpeg",
        0.9
      );
    });
  }

  function updateDraft(update: Partial<ImageAdjustment>) {
    draft = {
      ...draft,
      ...update,
      crop:
        update.crop !== undefined
          ? update.crop
            ? { ...update.crop }
            : undefined
          : draft.crop,
    };
  }

  function handleRotate(direction: "left" | "right") {
    const delta = direction === "left" ? -90 : 90;
    const raw = (((draft.rotation + delta) % 360) + 360) % 360;
    const normalized =
      raw === 0 || raw === 90 || raw === 180 || raw === 270 ? raw : 0;
    updateDraft({ rotation: normalized as ImageAdjustment["rotation"] });
  }

  function handleAspectChange(value: AspectRatio) {
    if (value === draft.aspectRatio) return;
    updateDraft({
      aspectRatio: value,
      crop: getDefaultCrop(value, getImageAspectRatio()),
    });
  }

  function handleReset() {
    updateDraft({
      rotation: 0,
      crop: getDefaultCrop(draft.aspectRatio, getImageAspectRatio()),
    });
  }

  async function handleSave() {
    if (isSaving) return;
    const normalizedCrop = normalizeCrop(
      draft.crop,
      draft.aspectRatio,
      getImageAspectRatio()
    );
    const adjustmentToSave: ImageAdjustment = {
      ...draft,
      crop: normalizedCrop,
    };
    let previewObjectUrl: string | null = null;
    try {
      isSaving = true;
      if (baseImage) {
        const canvas = applyImageAdjustmentsToCanvas(
          baseImage,
          adjustmentToSave
        );
        previewObjectUrl = await canvasToObjectUrl(canvas);
      }
      dispatch("save", {
        adjustment: adjustmentToSave,
        previewUrl: previewObjectUrl,
      });
    } catch (error) {
      console.error("Failed to generate preview:", error);
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
      dispatch("save", {
        adjustment: adjustmentToSave,
      });
    } finally {
      isSaving = false;
    }
  }

  function handleClose() {
    dispatch("close");
  }

  function startCropMove(event: PointerEvent) {
    if (event.button !== 0 || !draft.crop || !stageEl) return;
    event.preventDefault();
    event.stopPropagation();
    stageRect = stageEl.getBoundingClientRect();
    dragState = {
      type: "move",
      startX: event.clientX,
      startY: event.clientY,
      startCrop: { ...draft.crop },
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopPointerDrag);
  }

  function startResize(event: PointerEvent, handle: CornerHandle) {
    if (event.button !== 0 || !draft.crop || !stageEl) return;
    event.preventDefault();
    event.stopPropagation();
    stageRect = stageEl.getBoundingClientRect();
    dragState = {
      type: "resize",
      handle,
      startCrop: { ...draft.crop },
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopPointerDrag);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!dragState || !stageRect || !draft.crop) return;
    event.preventDefault();

    if (dragState.type === "move") {
      const dx = (event.clientX - dragState.startX) / stageRect.width;
      const dy = (event.clientY - dragState.startY) / stageRect.height;
      const next = normalizeCrop(
        {
          ...dragState.startCrop,
          x: dragState.startCrop.x + dx,
          y: dragState.startCrop.y + dy,
        },
        draft.aspectRatio,
        getImageAspectRatio()
      );
      updateDraft({ crop: next });
      return;
    }

    const pointer = getNormalizedPointer(event);
    if (!pointer) return;
    const next = resizeCropFromHandle(
      dragState.startCrop,
      pointer,
      dragState.handle,
      draft.aspectRatio
    );
    updateDraft({ crop: next });
  }

  $: ensureCropMatchesImage();

  function stopPointerDrag() {
    dragState = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopPointerDrag);
  }

  function getNormalizedPointer(event: PointerEvent) {
    if (!stageRect) return null;
    const x = clamp((event.clientX - stageRect.left) / stageRect.width, 0, 1);
    const y = clamp((event.clientY - stageRect.top) / stageRect.height, 0, 1);
    return { x, y };
  }

  function resizeCropFromHandle(
    initial: CropRect,
    pointer: { x: number; y: number },
    handle: CornerHandle,
    aspectRatio: AspectRatio
  ): CropRect {
    const ratio = getAspectRatioValue(aspectRatio);
    const normalizedRatio = ratio * getImageAspectRatio();
    let anchorX: number;
    let anchorY: number;
    let width: number;
    let height: number;
    let newX: number;
    let newY: number;

    switch (handle) {
      case "se":
        anchorX = initial.x;
        anchorY = initial.y;
        width = Math.max(pointer.x - anchorX, MIN_CROP_SIZE);
        height = Math.max(pointer.y - anchorY, MIN_CROP_SIZE);
        ({ width, height } = adjustToRatio(width, height, normalizedRatio));
        width = Math.min(width, 1 - anchorX);
        height = Math.min(height, 1 - anchorY);
        ({ width, height } = adjustToRatio(width, height, normalizedRatio));
        newX = anchorX;
        newY = anchorY;
        break;
      case "sw":
        anchorX = initial.x + initial.width;
        anchorY = initial.y;
        width = Math.max(anchorX - pointer.x, MIN_CROP_SIZE);
        height = Math.max(pointer.y - anchorY, MIN_CROP_SIZE);
        ({ width, height } = adjustToRatio(width, height, normalizedRatio));
        width = Math.min(width, anchorX);
        height = Math.min(height, 1 - anchorY);
        ({ width, height } = adjustToRatio(width, height, normalizedRatio));
        newX = anchorX - width;
        newY = anchorY;
        break;
      case "ne":
        anchorX = initial.x;
        anchorY = initial.y + initial.height;
        width = Math.max(pointer.x - anchorX, MIN_CROP_SIZE);
        height = Math.max(anchorY - pointer.y, MIN_CROP_SIZE);
        ({ width, height } = adjustToRatio(width, height, normalizedRatio));
        width = Math.min(width, 1 - anchorX);
        height = Math.min(height, anchorY);
        ({ width, height } = adjustToRatio(width, height, normalizedRatio));
        newX = anchorX;
        newY = anchorY - height;
        break;
      case "nw":
      default:
        anchorX = initial.x + initial.width;
        anchorY = initial.y + initial.height;
        width = Math.max(anchorX - pointer.x, MIN_CROP_SIZE);
        height = Math.max(anchorY - pointer.y, MIN_CROP_SIZE);
        ({ width, height } = adjustToRatio(width, height, normalizedRatio));
        width = Math.min(width, anchorX);
        height = Math.min(height, anchorY);
        ({ width, height } = adjustToRatio(width, height, normalizedRatio));
        newX = anchorX - width;
        newY = anchorY - height;
        break;
    }

    return normalizeCrop(
      {
        x: newX,
        y: newY,
        width,
        height,
      },
      aspectRatio,
      getImageAspectRatio()
    );
  }

  function adjustToRatio(
    width: number,
    height: number,
    normalizedRatio: number
  ) {
    const targetWidth = height * normalizedRatio;
    const targetHeight = width / normalizedRatio;

    if (targetWidth <= 1 && targetWidth >= MIN_CROP_SIZE) {
      width = targetWidth;
    } else {
      height = targetHeight;
      width = height * normalizedRatio;
    }

    width = Math.max(width, MIN_CROP_SIZE);
    height = Math.max(height, MIN_CROP_SIZE);
    return { width, height };
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
</script>

<svelte:window
  on:keydown={(event) => {
    if (event.key === "Escape") {
      handleClose();
    }
  }}
/>

<div
  class="editor-overlay"
  tabindex="-1"
  on:click={handleClose}
  on:keydown={(event) => event.key === "Enter" && handleClose()}
>
  <div
    class="editor-card"
    role="dialog"
    aria-modal="true"
    on:click|stopPropagation
    on:keydown|stopPropagation
  >
    <div class="editor-header">
      <div>
        <h2>Adjust image</h2>
        <p>Drag to crop, rotate, or switch aspect ratios.</p>
      </div>
      <button
        class="close-button"
        type="button"
        on:click={handleClose}
        aria-label="Close editor"
      >
        ✕
      </button>
    </div>

    <div class="editor-body">
      <div class="preview-column">
        <div
          class="crop-stage"
          bind:this={stageEl}
          style={`aspect-ratio: ${rotatedDimensions.width} / ${rotatedDimensions.height};`}
        >
          {#if rotatedPreviewUrl || previewUrl}
            <img
              src={rotatedPreviewUrl || previewUrl}
              alt="Preview"
              draggable="false"
            />
          {/if}

          {#if draft.crop}
            <div
              class="crop-overlay"
              style={`left: ${draft.crop.x * 100}%;
                top: ${draft.crop.y * 100}%;
                width: ${draft.crop.width * 100}%;
                height: ${draft.crop.height * 100}%;`}
              on:pointerdown|preventDefault={startCropMove}
            >
              <div class="crop-grid" aria-hidden="true" />
              <button
                type="button"
                class="crop-handle nw"
                aria-label="Resize from top left"
                on:pointerdown|preventDefault={(event) =>
                  startResize(event, "nw")}
              />
              <button
                type="button"
                class="crop-handle ne"
                aria-label="Resize from top right"
                on:pointerdown|preventDefault={(event) =>
                  startResize(event, "ne")}
              />
              <button
                type="button"
                class="crop-handle sw"
                aria-label="Resize from bottom left"
                on:pointerdown|preventDefault={(event) =>
                  startResize(event, "sw")}
              />
              <button
                type="button"
                class="crop-handle se"
                aria-label="Resize from bottom right"
                on:pointerdown|preventDefault={(event) =>
                  startResize(event, "se")}
              />
            </div>
          {/if}
        </div>
        <p class="helper-text">
          Drag inside the frame to move or use the corners to resize.
        </p>
      </div>

      <div class="controls-column">
        <div class="control-group">
          <p class="control-label">Aspect ratio</p>
          <div class="segment">
            <button
              type="button"
              class:selected={draft.aspectRatio === "4:3"}
              on:click={() => handleAspectChange("4:3")}
            >
              4 : 3
            </button>
            <button
              type="button"
              class:selected={draft.aspectRatio === "3:4"}
              on:click={() => handleAspectChange("3:4")}
            >
              3 : 4
            </button>
            <button
              type="button"
              class:selected={draft.aspectRatio === "1:1"}
              on:click={() => handleAspectChange("1:1")}
            >
              1 : 1
            </button>
          </div>
        </div>

        <div class="control-group">
          <p class="control-label">Rotate</p>
          <div class="button-row icon">
            <button
              type="button"
              on:click={() => handleRotate("left")}
              aria-label="Rotate -90 degrees"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              on:click={() => handleRotate("right")}
              aria-label="Rotate +90 degrees"
            >
              <RotateCw size={18} />
            </button>
          </div>
        </div>

        <div class="control-row">
          <button type="button" class="ghost" on:click={handleReset}>
            Reset
          </button>
          <div class="actions">
            <button type="button" class="ghost" on:click={handleClose}>
              Cancel
            </button>
            <button
              type="button"
              class="primary"
              on:click={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .editor-overlay {
    @apply fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4 py-6;
  }

  .editor-card {
    @apply bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 space-y-6;
  }

  .editor-header {
    @apply flex items-start justify-between gap-4;
  }

  .editor-header h2 {
    @apply text-xl font-semibold text-neutral-900;
  }

  .editor-header p {
    @apply text-sm text-neutral-500;
  }

  .close-button {
    @apply text-xl leading-none text-neutral-500 hover:text-neutral-900 transition-colors;
  }

  .editor-body {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
  }

  .preview-column {
    @apply space-y-3;
  }

  .crop-stage {
    @apply relative w-full bg-neutral-900 rounded-xl overflow-hidden;
  }

  .crop-stage img {
    @apply w-full h-full object-cover pointer-events-none select-none;
  }

  .crop-overlay {
    @apply absolute border-2 border-white/90 shadow-[0_0_0_20000px_rgba(0,0,0,0.45)] cursor-move;
  }

  .crop-grid {
    @apply absolute inset-0 pointer-events-none;
    background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.4) 1px,
        transparent 1px
      ),
      linear-gradient(180deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px);
    background-size: calc(100% / 3) calc(100% / 3);
  }

  .crop-handle {
    @apply absolute w-4 h-4 bg-white rounded-full border border-neutral-400 cursor-pointer;
  }

  .crop-handle.nw {
    @apply -top-2 -left-2 cursor-nwse-resize;
  }

  .crop-handle.ne {
    @apply -top-2 -right-2 cursor-nesw-resize;
  }

  .crop-handle.sw {
    @apply -bottom-2 -left-2 cursor-nesw-resize;
  }

  .crop-handle.se {
    @apply -bottom-2 -right-2 cursor-nwse-resize;
  }

  .helper-text {
    @apply text-xs text-neutral-500;
  }

  .controls-column {
    @apply space-y-5;
  }

  .control-group {
    @apply space-y-2;
  }

  .control-label {
    @apply text-sm font-medium text-neutral-600;
  }

  .segment {
    @apply inline-flex rounded-full bg-neutral-100 p-1 gap-1;
  }

  .segment button {
    @apply px-4 py-1.5 text-sm rounded-full text-neutral-600 hover:text-neutral-900;
  }

  .segment button.selected {
    @apply bg-white text-neutral-900 shadow;
  }

  .button-row {
    @apply flex gap-3;
  }

  .button-row.icon button {
    @apply flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:border-neutral-400;
  }

  .control-row {
    @apply flex items-center justify-between gap-4 flex-wrap;
  }

  .ghost {
    @apply px-4 py-2 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:text-neutral-900 hover:border-neutral-400;
  }

  .actions {
    @apply flex gap-3;
  }

  .primary {
    @apply px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700;
  }

  .primary:disabled {
    @apply opacity-70 cursor-not-allowed hover:bg-blue-600;
  }
</style>
