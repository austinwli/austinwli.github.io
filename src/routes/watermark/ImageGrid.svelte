<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { X } from "lucide-svelte";
  import type { WatermarkConfig } from "./types";
  import { calculateImageTimestamp, getRangeName } from "./utils";

  export let files: File[] = [];
  export let onProcess: (() => void) | null = null;
  export let canProcess = false;
  export let config: WatermarkConfig;
  export let selectedIndices: Set<number> = new Set();
  export let onSelectionToggle: ((index: number) => void) | null = null;
  export let onSelectAll: (() => void) | null = null;
  export let onSelectNone: (() => void) | null = null;
  export let onBulkAssign: ((rangeId: string) => void) | null = null;

  const dispatch = createEventDispatcher<{ remove: number; clearAll: void }>();

  function handleRemove(index: number) {
    dispatch("remove", index);
  }

  function handleClearAll() {
    dispatch("clearAll");
  }

  function handleSelectionToggle(index: number) {
    onSelectionToggle?.(index);
  }

  function getAssignment(imageIndex: number) {
    return config.assignments.find((a) => a.imageIndex === imageIndex);
  }

  // Initialize selectedRangeId only if it's not set or invalid
  let selectedRangeId = "";
  $: {
    if (
      !selectedRangeId ||
      !config.timeRanges.find((r) => r.id === selectedRangeId)
    ) {
      selectedRangeId =
        config.timeRanges.length > 0 ? config.timeRanges[0].id : "";
    }
  }
</script>

{#if files.length > 0}
  <div class="space-y-4">
    <!-- Selection and Assignment Controls -->
    <div class="controls-section">
      <div class="text-sm text-neutral-600">
        {files.length}
        {files.length === 1 ? "image" : "images"} uploaded
        {#if selectedIndices.size > 0}
          <span class="text-neutral-700 font-medium ml-1">
            ({selectedIndices.size} selected)
          </span>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 text-sm">
          <button
            type="button"
            class="text-blue-500 hover:text-blue-600 transition-colors"
            on:click={onSelectAll}
          >
            Select all
          </button>
          <span class="text-neutral-300">|</span>
          <button
            type="button"
            class="text-blue-500 hover:text-blue-600 transition-colors"
            on:click={onSelectNone}
          >
            None
          </button>
        </div>

        {#if selectedIndices.size > 0 && onBulkAssign}
          <div class="flex items-center gap-2">
            <span class="text-sm text-neutral-500">Assign to:</span>
            <select
              bind:value={selectedRangeId}
              class="text-sm border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              {#each config.timeRanges as range, i (range.id)}
                <option value={range.id}>Range {i + 1}</option>
              {/each}
            </select>
            <button
              type="button"
              class="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
              on:click={() => onBulkAssign?.(selectedRangeId)}
            >
              Assign
            </button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="header-actions">
      <div />
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
        {@const assignment = getAssignment(i)}
        {@const timestamp = calculateImageTimestamp(config, i)}
        <div class="image-card group" class:selected={selectedIndices.has(i)}>
          <!-- Checkbox -->
          <button
            type="button"
            class="checkbox-btn"
            on:click={() => handleSelectionToggle(i)}
            aria-label="Select {file.name}"
          >
            <input
              type="checkbox"
              checked={selectedIndices.has(i)}
              on:click|stopPropagation
              on:change={() => handleSelectionToggle(i)}
              class="w-4 h-4"
            />
          </button>

          <!-- Image -->
          <img
            src={URL.createObjectURL(file)}
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
            {#if assignment}
              <p class="text-xs text-neutral-700 font-medium">
                {getRangeName(config.timeRanges, assignment.rangeId)}
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
  .controls-section {
    @apply flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3
           pb-3 border-b border-neutral-200;
  }

  .header-actions {
    @apply flex items-center justify-between;
  }

  .button-group {
    @apply flex items-center gap-6;
  }

  .image-card {
    @apply relative rounded-lg overflow-hidden bg-neutral-100 border-2 border-transparent
           transition-all;
  }

  .image-card.selected {
    @apply border-blue-500 ring-2 ring-blue-200;
  }

  .checkbox-btn {
    @apply absolute top-2 left-2 z-10;
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
