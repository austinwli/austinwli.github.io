<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { X } from "lucide-svelte";
  import type { WatermarkConfig } from "./types";
  import { calculateImageTimestamp } from "./utils";

  export let files: File[] = [];
  export let onProcess: (() => void) | null = null;
  export let canProcess = false;
  export let config: WatermarkConfig;

  const dispatch = createEventDispatcher<{
    remove: number;
    clearAll: void;
    reorder: { from: number; to: number };
  }>();

  // Drag and drop state
  let draggedIndex: number | null = null;
  let dragOverIndex: number | null = null;

  // Cache blob URLs to prevent memory leaks
  let blobUrls: string[] = [];
  $: {
    // Revoke old URLs
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    // Create new URLs for current files
    blobUrls = files.map((file) => URL.createObjectURL(file));
  }

  // Clean up on component destroy
  onDestroy(() => {
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
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
          <img
            src={blobUrls[i]}
            alt={file.name}
            class="w-full h-48 sm:h-56 md:h-64 object-cover rounded"
            draggable="false"
          />

          <!-- Remove Button -->
          <button
            type="button"
            class="remove-btn-mobile"
            on:click={() => handleRemove(i)}
            aria-label="Remove {file.name}"
          >
            <X size={16} />
          </button>

          <!-- Assignment Info -->
          <div class="assignment-info-mobile">
            {#if timestamp}
              <p class="text-sm text-neutral-600 truncate">{timestamp}</p>
            {:else}
              <p class="text-sm text-neutral-400 italic">Not assigned</p>
            {/if}
          </div>
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
    @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4;
  }

  .image-card-mobile {
    @apply relative rounded-lg overflow-hidden bg-neutral-100
           transition-all cursor-move;
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
    @apply mt-2 px-2 pb-2 min-h-[2.5rem] flex flex-col justify-center;
  }
</style>
