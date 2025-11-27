<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { X } from "lucide-svelte";
  import type { WatermarkConfig, ImageAdjustment } from "./types";
  import { calculateImageTimestamp } from "./utils";
  import {
    DEFAULT_IMAGE_ADJUSTMENT,
    applyImageAdjustmentsToCanvas,
  } from "./imageTransforms";

  export let files: File[] = [];
  export let imageAdjustments: ImageAdjustment[] = [];
  export let onProcess: (() => void) | null = null;
  export let canProcess = false;
  export let config: WatermarkConfig;
  export let previewOverrides: (string | null)[] = [];

  const dispatch = createEventDispatcher<{
    remove: number;
    clearAll: void;
    reorder: { from: number; to: number };
    edit: number;
  }>();
  function handleEdit(index: number) {
    dispatch("edit", index);
  }

  // Drag and drop state
  let draggedIndex: number | null = null;
  let dragOverIndex: number | null = null;

  const aspectRatioMap: Record<ImageAdjustment["aspectRatio"], string> = {
    "4:3": "4 / 3",
    "3:4": "3 / 4",
    "1:1": "1 / 1",
  };

  function aspectRatioValue(ratio: ImageAdjustment["aspectRatio"]) {
    return aspectRatioMap[ratio] ?? "auto";
  }

  // Cache blob URLs to prevent memory leaks
  let blobUrls: string[] = [];
  $: {
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    blobUrls = files.map((file) => URL.createObjectURL(file));
  }

  // Pre-render adjusted previews
  let previewUrls: string[] = [];
  let previewGeneration = 0;

  async function loadImage(file: File): Promise<HTMLImageElement> {
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

  async function createPreviewUrl(
    file: File,
    adjustment?: ImageAdjustment
  ): Promise<string> {
    const img = await loadImage(file);
    const canvas = applyImageAdjustmentsToCanvas(img, adjustment);

    const maxSide = 600;
    const largestSide = Math.max(canvas.width, canvas.height);
    let targetCanvas = canvas;

    if (largestSide > maxSide) {
      const scale = maxSide / largestSide;
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = Math.max(1, Math.round(canvas.width * scale));
      scaledCanvas.height = Math.max(1, Math.round(canvas.height * scale));
      const ctx = scaledCanvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        targetCanvas = scaledCanvas;
      }
    }

    return new Promise<string>((resolve, reject) => {
      targetCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error("Failed to generate preview"));
          }
        },
        "image/jpeg",
        0.9
      );
    });
  }

  async function regeneratePreviews() {
    if (typeof window === "undefined") return;
    const currentGeneration = ++previewGeneration;

    if (files.length === 0) {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls = [];
      return;
    }

    try {
      const urls = await Promise.all(
        files.map((file, index) =>
          createPreviewUrl(file, imageAdjustments[index])
        )
      );

      if (currentGeneration !== previewGeneration) {
        urls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls = urls;
    } catch (error) {
      console.error("Failed to generate previews:", error);
    }
  }

  $: regeneratePreviews();

  // Clean up on component destroy
  onDestroy(() => {
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
  });

  function handleRemove(index: number) {
    dispatch("remove", index);
  }

  function handleClearAll() {
    dispatch("clearAll");
  }

  // Drag handlers
  function handleDragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    e.dataTransfer!.effectAllowed = "move";
    e.dataTransfer!.setData("text/plain", index.toString());

    // Add visual feedback
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }

  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";

    if (draggedIndex !== null && draggedIndex !== index) {
      dragOverIndex = index;
    }
  }

  function handleDragLeave() {
    dragOverIndex = null;
  }

  function handleDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      dragOverIndex = null;
      return;
    }

    // Dispatch reorder event
    dispatch("reorder", { from: draggedIndex, to: dropIndex });

    draggedIndex = null;
    dragOverIndex = null;
  }
</script>

{#if files.length > 0}
  <div class="space-y-4">
    <!-- Header with file count and actions -->
    <div class="header-actions">
      <div class="text-sm text-neutral-600">
        {files.length}
        {files.length === 1 ? "image" : "images"} uploaded
      </div>
      <div class="button-group">
        <button
          type="button"
          class="text-sm text-neutral-500 hover:text-red-600 transition-colors"
          on:click={handleClearAll}
        >
          Clear all
        </button>
        {#if onProcess}
          <button
            type="button"
            class="text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed px-3 py-1.5 rounded"
            on:click={onProcess}
            disabled={!canProcess}
          >
            Download images
          </button>
        {/if}
      </div>
    </div>

    <!-- Image Grid -->
    <div class="image-grid-responsive">
      {#each files as file, i (i)}
        {@const timestamp = calculateImageTimestamp(config, i)}
        {@const adjustment = imageAdjustments[i] ?? DEFAULT_IMAGE_ADJUSTMENT}
        <div
          class="image-card-mobile group"
          class:drag-over={dragOverIndex === i}
          class:is-dragging={draggedIndex === i}
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, i)}
          on:dragend={handleDragEnd}
          on:dragover={(e) => handleDragOver(e, i)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, i)}
          role="button"
          tabindex="0"
          aria-label="Drag to reorder image {i + 1}"
        >
          <!-- Image -->
          <div
            class="image-wrapper"
            role="button"
            tabindex="0"
            aria-label="Edit image {i + 1}"
            on:click|stopPropagation={() => handleEdit(i)}
            on:keydown={(event) =>
              event.key === "Enter" && (event.preventDefault(), handleEdit(i))}
            style={`aspect-ratio: ${aspectRatioValue(adjustment.aspectRatio)};`}
          >
            <img
              src={previewOverrides[i] ?? previewUrls[i] ?? blobUrls[i]}
              alt={file.name}
              class="image-preview"
              draggable="false"
            />

            <!-- Timestamp Overlay -->
            <div class="assignment-info-mobile">
              {#if timestamp}
                <p>{timestamp}</p>
              {:else}
                <p>Not assigned</p>
              {/if}
            </div>

            <div class="edit-indicator" aria-hidden="true">Click to edit</div>
          </div>

          <!-- Remove Button -->
          <button
            type="button"
            class="remove-btn-mobile"
            on:click={() => handleRemove(i)}
            aria-label="Remove {file.name}"
          >
            <X size={16} />
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style lang="postcss">
  .header-actions {
    @apply flex items-center justify-between;
  }

  .button-group {
    @apply flex items-center gap-6;
  }

  .image-grid-responsive {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start;
  }

  .image-card-mobile {
    @apply relative rounded-lg overflow-hidden bg-neutral-100
           transition-all cursor-move;
  }

  .image-wrapper {
    @apply relative w-full cursor-pointer rounded-lg overflow-hidden bg-white focus:outline-none focus:ring-2 focus:ring-blue-500;
  }

  .image-preview {
    @apply block w-full h-full object-cover rounded-lg transition-transform duration-300 ease-out;
  }

  .edit-indicator {
    @apply absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs text-white bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity;
  }

  .image-wrapper:focus-visible .edit-indicator,
  .image-wrapper:focus-within .edit-indicator {
    @apply opacity-100;
  }

  .image-card-mobile:hover {
    @apply shadow-md;
  }

  .image-card-mobile.is-dragging {
    @apply opacity-50 scale-95;
  }

  .image-card-mobile.drag-over {
    @apply ring-2 ring-blue-500 ring-offset-2;
  }

  .remove-btn-mobile {
    @apply absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/70 text-white rounded-full
           p-2 opacity-0 group-hover:opacity-100 transition-opacity
           hover:bg-black/90 z-10 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center;
  }

  .assignment-info-mobile {
    @apply absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/70 text-white
           rounded-full px-3 py-1 text-xs sm:text-sm font-medium
           flex items-center justify-center min-h-[28px] min-w-[28px]
           pointer-events-none;
  }

  .assignment-info-mobile p {
    @apply leading-tight whitespace-nowrap;
  }
</style>
