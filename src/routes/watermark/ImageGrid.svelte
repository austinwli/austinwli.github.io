<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { X } from "lucide-svelte";
  import type { WatermarkConfig } from "./types";
  import { calculateImageTimestamp, getImageRange } from "./utils";

  export let files: File[] = [];
  export let onProcess: (() => void) | null = null;
  export let canProcess = false;
  export let config: WatermarkConfig;

  const dispatch = createEventDispatcher<{ remove: number; clearAll: void }>();

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
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {#each files as file, i (i)}
        {@const imageRange = getImageRange(config, i)}
        {@const timestamp = calculateImageTimestamp(config, i)}
        <div class="image-card group">
          <!-- Image -->
          <img
            src={blobUrls[i]}
            alt={file.name}
            class="w-full h-24 object-cover rounded"
          />

          <!-- Remove Button -->
          <button
            type="button"
            class="remove-btn"
            on:click={() => handleRemove(i)}
            aria-label="Remove {file.name}"
          >
            <X size={14} />
          </button>

          <!-- Assignment Info -->
          <div class="assignment-info">
            {#if imageRange}
              <p class="text-xs text-neutral-700 font-medium">
                Range {imageRange.rangeIndex + 1}
              </p>
              {#if timestamp}
                <p class="text-xs text-neutral-600">{timestamp}</p>
              {/if}
            {:else}
              <p class="text-xs text-neutral-400 italic">Not assigned</p>
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

  .image-card {
    @apply relative rounded-lg overflow-hidden bg-neutral-100;
  }

  .remove-btn {
    @apply absolute top-2 right-2 bg-black/60 text-white rounded-full
           p-1 opacity-0 group-hover:opacity-100 transition-opacity
           hover:bg-black/80 z-10;
  }

  .assignment-info {
    @apply mt-1 px-1 pb-1 space-y-0.5;
  }
</style>
