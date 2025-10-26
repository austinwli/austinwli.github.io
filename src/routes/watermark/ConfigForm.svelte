<script lang="ts">
  import type { WatermarkConfig, TimeRange } from "./types";

  export let config: WatermarkConfig;
  export let totalImages: number = 0;

  function addTimeRange() {
    const newRange: TimeRange = {
      id: crypto.randomUUID(),
      startTime: "10:00",
      incrementMinutes: 2,
      photoCount: 0,
    };
    config.timeRanges = [...config.timeRanges, newRange];
  }

  function removeTimeRange(id: string) {
    config.timeRanges = config.timeRanges.filter((r) => r.id !== id);
  }

  function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")}${period}`;
  }

  function formatPreview(cfg: WatermarkConfig): string {
    if (!cfg.date || !cfg.street || !cfg.city || !cfg.state || !cfg.zip) {
      return "Fill in all fields to see preview...";
    }

    // Convert date from YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = cfg.date.split("-");
    const dateStr = `${month}/${day}/${year}`;

    // Use first time range for preview
    const timeStr =
      cfg.timeRanges.length > 0
        ? formatTime(cfg.timeRanges[0].startTime)
        : "10:00AM";

    // Format address in uppercase for preview
    return `${dateStr} ${timeStr}\n${cfg.street.toUpperCase()}\n${cfg.city.toUpperCase()}, ${cfg.state.toUpperCase()} ${
      cfg.zip
    }`;
  }

  $: totalAssigned = config.timeRanges.reduce(
    (sum, range) => sum + range.photoCount,
    0
  );
  $: hasCountMismatch = totalImages > 0 && totalAssigned !== totalImages;
</script>

<div class="space-y-4">
  <!-- Date Field -->
  <div class="form-field">
    <label for="date">Date</label>
    <input id="date" type="date" bind:value={config.date} required />
  </div>

  <!-- Address Fields -->
  <div class="form-grid-responsive">
    <div class="form-field full-width">
      <label for="street">Street Address</label>
      <input
        id="street"
        type="text"
        bind:value={config.street}
        placeholder="101 Dunster St."
        required
      />
    </div>

    <div class="address-row">
      <div class="form-field">
        <label for="city">City</label>
        <input
          id="city"
          type="text"
          bind:value={config.city}
          placeholder="Cambridge"
          required
        />
      </div>

      <div class="form-field">
        <label for="state">State</label>
        <input
          id="state"
          type="text"
          bind:value={config.state}
          placeholder="MA"
          maxlength="2"
          required
        />
      </div>

      <div class="form-field">
        <label for="zip">ZIP Code</label>
        <input
          id="zip"
          type="text"
          bind:value={config.zip}
          placeholder="02138"
          maxlength="10"
          required
        />
      </div>
    </div>
  </div>

  <!-- Time Ranges -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-sm text-neutral-500 font-medium">Time Ranges</span>
      <button
        type="button"
        class="text-sm text-blue-500 hover:text-blue-600 transition-colors"
        on:click={addTimeRange}
      >
        + Add range
      </button>
    </div>

    {#if config.timeRanges.length === 0}
      <p class="text-sm text-neutral-500">
        No time ranges defined. Add at least one.
      </p>
    {:else}
      {#each config.timeRanges as range, i (range.id)}
        <div class="time-range-card">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-neutral-700"
              >Range {i + 1}</span
            >
            {#if config.timeRanges.length > 1}
              <button
                type="button"
                class="text-sm text-red-600 hover:text-red-700 transition-colors"
                on:click={() => removeTimeRange(range.id)}
              >
                Remove
              </button>
            {/if}
          </div>
          <div class="range-grid-responsive">
            <div class="form-field">
              <label for="startTime-{range.id}">Start Time</label>
              <input
                id="startTime-{range.id}"
                type="time"
                bind:value={range.startTime}
                required
              />
            </div>
            <div class="form-field">
              <label for="increment-{range.id}">Increment (min)</label>
              <input
                id="increment-{range.id}"
                type="number"
                bind:value={range.incrementMinutes}
                min="1"
                max="1440"
                required
              />
            </div>
            <div class="form-field">
              <label for="photoCount-{range.id}">Number of Photos</label>
              <input
                id="photoCount-{range.id}"
                type="number"
                bind:value={range.photoCount}
                min="0"
                max="100"
                required
              />
            </div>
          </div>
        </div>
      {/each}
    {/if}

    {#if totalImages > 0}
      <div class="text-sm text-neutral-600">
        Total photos assigned: <span
          class:text-red-600={hasCountMismatch}
          class:font-medium={hasCountMismatch}>{totalAssigned}</span
        >
        / {totalImages}
      </div>
    {/if}

    {#if hasCountMismatch && totalImages > 0}
      <p class="text-sm text-red-600">
        Total photos in ranges must equal uploaded images
      </p>
    {/if}
  </div>

  <pre class="preview-text">{formatPreview(config)}</pre>
</div>

<style lang="postcss">
  .form-grid-responsive {
    @apply space-y-4;
  }

  .address-row {
    @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
  }

  .form-field {
    @apply space-y-2;
  }

  .form-field.full-width {
    @apply w-full;
  }

  label {
    @apply block text-sm text-neutral-500;
  }

  input {
    @apply w-full px-4 py-3 border border-neutral-300 rounded
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
           text-neutral-900 bg-white transition-colors
           text-base;
  }

  .time-range-card {
    @apply border border-neutral-300 rounded p-4 bg-neutral-50;
  }

  .range-grid-responsive {
    @apply grid grid-cols-1 sm:grid-cols-3 gap-3;
  }

  .preview-text {
    @apply text-sm text-neutral-500 font-mono whitespace-pre-line;
  }
</style>
