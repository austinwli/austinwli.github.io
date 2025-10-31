<script lang="ts">
  import type { WatermarkConfig, TimeRange } from "./types";

  export let config: WatermarkConfig;
  export let selectedPhotoCount: 18 | 30 | 42 | 66;
  export let totalImages: number = 0;

  function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")}${period}`;
  }

  /**
   * Format a single range preview string
   */
  function formatRangePreview(
    cfg: WatermarkConfig,
    range: TimeRange
  ): string | null {
    if (!cfg.date || !cfg.street || !cfg.city || !cfg.state || !cfg.zip) {
      return null;
    }

    // Convert date from YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = cfg.date.split("-");
    const dateStr = `${month}/${day}/${year}`;

    // Format start time
    const timeStr = formatTime(range.startTime);

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
        placeholder="101 Dunster St"
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

  <!-- Time Range -->
  <div class="space-y-3">
    <span class="text-sm text-neutral-500 font-medium">Time Range</span>

    {#if config.timeRanges.length > 0}
      <div class="time-range-card">
        <div class="space-y-3">
          <div class="form-field">
            <label for="startTime-{config.timeRanges[0].id}">Start Time</label>
            <input
              id="startTime-{config.timeRanges[0].id}"
              type="time"
              bind:value={config.timeRanges[0].startTime}
              required
            />
          </div>
          <div class="form-field">
            <label for="photoCount">Number of Photos</label>
            <select id="photoCount" bind:value={selectedPhotoCount}>
              <option value={18}>18</option>
              <option value={30}>30</option>
              <option value={42}>42</option>
              <option value={66}>66</option>
            </select>
          </div>
        </div>
      </div>
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

  <!-- Preview Section -->
  <div class="preview-section">
    <p class="text-sm text-neutral-500 mb-3">Preview</p>
    {#if !config.date || !config.street || !config.city || !config.state || !config.zip}
      <p class="text-sm text-neutral-400 italic">
        Fill in all fields to see preview...
      </p>
    {:else if config.timeRanges.length > 0}
      {@const range = config.timeRanges[0]}
      {@const preview = formatRangePreview(config, range)}
      {#if preview}
        <pre class="preview-text">{preview}</pre>
      {:else}
        <p class="text-sm text-neutral-400 italic">Invalid configuration</p>
      {/if}
    {/if}
  </div>
</div>

<style lang="postcss">
  .form-grid-responsive {
    @apply space-y-4;
  }

  .address-row {
    @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
  }

  .form-field {
    @apply space-y-2 min-w-0;
    /* Safari-specific container fixes */
    max-width: 100%;
    overflow: hidden;
  }

  .form-field.full-width {
    @apply w-full;
  }

  /* Safari-specific form field overrides */
  @supports (-webkit-appearance: none) {
    .form-field {
      /* Force Safari to respect container bounds */
      max-width: 100% !important;
      overflow: hidden !important;
      min-width: 0 !important;
    }
  }

  label {
    @apply block text-sm text-neutral-500;
  }

  input,
  select {
    @apply w-full px-4 py-3 border border-neutral-300 rounded
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
           text-neutral-900 bg-white transition-colors
           text-base;
  }

  select {
    @apply cursor-pointer;
  }

  /* Override browser defaults for date and time inputs */
  input[type="date"],
  input[type="time"] {
    @apply w-full min-w-0 max-w-full;
    /* Force override browser minimum width */
    min-width: 0 !important;
    max-width: 100% !important;
    /* Ensure text alignment matches other inputs */
    text-align: left !important;
    /* Prevent browser from centering content */
    justify-content: flex-start !important;
    /* Safari-specific fixes */
    -webkit-appearance: none !important;
    appearance: none !important;
    /* Force Safari to respect our sizing */
    width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Safari-specific overrides */
  @supports (-webkit-appearance: none) {
    input[type="date"],
    input[type="time"] {
      /* More aggressive Safari overrides */
      min-width: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      /* Remove Safari's default styling */
      -webkit-appearance: none !important;
      appearance: none !important;
      /* Force Safari to use our padding */
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }
  }

  /* Mobile-specific fixes for date/time inputs */
  @media (max-width: 640px) {
    input[type="date"],
    input[type="time"] {
      @apply text-sm;
      /* Reduce padding slightly on mobile to fit better */
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
      /* Force smaller font size on mobile */
      font-size: 14px !important;
      /* Mobile Safari specific overrides */
      -webkit-appearance: none !important;
      appearance: none !important;
      /* Force mobile Safari to respect our sizing */
      min-width: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
    }
  }

  /* iOS Safari specific fixes */
  @media screen and (-webkit-min-device-pixel-ratio: 0) {
    input[type="date"],
    input[type="time"] {
      /* iOS Safari overrides */
      -webkit-appearance: none !important;
      appearance: none !important;
      min-width: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      /* Force iOS Safari to use our styling */
      border-radius: 0.375rem !important;
      border: 1px solid #d1d5db !important;
    }
  }

  .time-range-card {
    @apply border border-neutral-300 rounded p-3 bg-neutral-50;
    /* Prevent overflow */
    overflow: hidden;
  }

  /* Ensure form fields within time range cards don't overflow */
  .time-range-card .form-field {
    @apply min-w-0;
  }

  .time-range-card input {
    @apply min-w-0;
  }

  .preview-section {
    @apply mt-6;
  }

  .preview-text {
    @apply text-sm text-neutral-500 font-mono whitespace-pre-line;
  }
</style>
