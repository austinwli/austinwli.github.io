<script lang="ts">
  import type { AdvancedOptions } from "./types";

  export let options: AdvancedOptions;
</script>

<div class="space-y-4">
  <p class="text-sm text-neutral-500">Advanced options (optional)</p>

  <div class="options-grid">
    <div class="form-field">
      <label for="position">Position</label>
      <select id="position" bind:value={options.position}>
        <option value="top-left">Top Left</option>
        <option value="top-right">Top Right</option>
        <option value="bottom-left">Bottom Left</option>
        <option value="bottom-right">Bottom Right</option>
      </select>
    </div>

    <div class="form-field">
      <label for="fontSize">Text Size</label>
      <select id="fontSize" bind:value={options.fontSize}>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </div>

    <div class="form-field">
      <span class="field-label">Text Color</span>
      <div class="flex gap-4 mt-2">
        <label class="radio-label">
          <input type="radio" bind:group={options.textColor} value="white" />
          White
        </label>
        <label class="radio-label">
          <input type="radio" bind:group={options.textColor} value="black" />
          Black
        </label>
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .options-grid {
    @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
  }

  .form-field {
    @apply space-y-1.5;
  }

  label,
  .field-label {
    @apply block text-sm text-neutral-500;
  }

  select {
    @apply w-full px-3 py-2 border border-neutral-300 rounded
           focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400
           bg-white text-neutral-900 cursor-pointer transition-colors;
  }

  .radio-label {
    @apply flex items-center gap-2 cursor-pointer text-sm sm:text-sm text-neutral-700
           hover:text-black transition-colors py-2;
  }

  input[type="radio"] {
    @apply cursor-pointer w-4 h-4;
  }
</style>
