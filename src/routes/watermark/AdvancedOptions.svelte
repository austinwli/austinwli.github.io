<script lang="ts">
  import type { AdvancedOptions } from "./types";

  export let options: AdvancedOptions;

  const borderWidths = [
    { name: "Thin", value: "thin" },
    { name: "Medium", value: "medium" },
    { name: "Thick", value: "thick" },
  ];

  // Track selected radio state for text and border colors
  // Initialize based on current color values
  let selectedTextColorRadio: "white" | "black" | "custom" =
    options.textColor === "white" || options.textColor === "black"
      ? options.textColor
      : "custom";
  let selectedBorderColorRadio: "white" | "black" | "custom" =
    options.borderColor === "white" || options.borderColor === "black"
      ? options.borderColor
      : "custom";

  // Sync radio selection with actual color value (reactive)
  $: {
    if (options.textColor === "white" || options.textColor === "black") {
      selectedTextColorRadio = options.textColor;
    } else if (
      typeof options.textColor === "string" &&
      options.textColor.startsWith("#")
    ) {
      selectedTextColorRadio = "custom";
    }
  }

  $: {
    if (options.hasBorder) {
      if (options.borderColor === "white" || options.borderColor === "black") {
        selectedBorderColorRadio = options.borderColor;
      } else if (
        typeof options.borderColor === "string" &&
        options.borderColor.startsWith("#")
      ) {
        selectedBorderColorRadio = "custom";
      }
    }
  }

  $: isCustomColor = selectedTextColorRadio === "custom";
  $: isCustomBorderColor =
    options.hasBorder && selectedBorderColorRadio === "custom";

  // Initialize custom color if user selects "custom"
  function handleTextColorChange(value: "white" | "black" | "custom") {
    selectedTextColorRadio = value;
    if (value === "custom") {
      options.textColor = "#FFFFFF";
    } else {
      options.textColor = value;
    }
  }

  function handleBorderColorChange(value: "white" | "black" | "custom") {
    selectedBorderColorRadio = value;
    if (value === "custom") {
      options.borderColor = "#000000";
    } else {
      options.borderColor = value;
    }
  }

  function handleTextColorPickerChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target) {
      options.textColor = target.value.toUpperCase();
      selectedTextColorRadio = "custom";
    }
  }

  function handleBorderColorPickerChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target) {
      options.borderColor = target.value.toUpperCase();
      selectedBorderColorRadio = "custom";
    }
  }

  function handleTextColorHexChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target) {
      const value = target.value.trim();
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        options.textColor = value.toUpperCase();
        selectedTextColorRadio = "custom";
      }
    }
  }

  function handleBorderColorHexChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target) {
      const value = target.value.trim();
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        options.borderColor = value.toUpperCase();
        selectedBorderColorRadio = "custom";
      }
    }
  }
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
  </div>

  <!-- Bold Toggle -->
  <div class="form-field">
    <label class="flex items-center space-x-2 cursor-pointer">
      <input type="checkbox" bind:checked={options.bold} />
      <span>Bold text</span>
    </label>
  </div>

  <!-- Text Color Section -->
  <div class="form-field">
    <label for="textColor">Text Color</label>
    <div class="color-selector">
      <div class="color-options">
        <label class="color-option">
          <input
            type="radio"
            bind:group={selectedTextColorRadio}
            value="white"
            on:change={() => handleTextColorChange("white")}
          />
          <div class="color-preview white" />
          <span>White</span>
        </label>
        <label class="color-option">
          <input
            type="radio"
            bind:group={selectedTextColorRadio}
            value="black"
            on:change={() => handleTextColorChange("black")}
          />
          <div class="color-preview black" />
          <span>Black</span>
        </label>
        <label class="color-option">
          <input
            type="radio"
            bind:group={selectedTextColorRadio}
            value="custom"
            on:change={() => handleTextColorChange("custom")}
          />
          <div class="color-preview custom" />
          <span>Custom</span>
        </label>
      </div>
      {#if isCustomColor}
        <div class="color-picker-wrapper">
          <label for="textColorPicker" class="color-picker-label"
            >Choose Color</label
          >
          <div class="color-picker-container">
            <input
              id="textColorPicker"
              type="color"
              value={options.textColor}
              on:change={handleTextColorPickerChange}
              class="color-picker"
            />
            <input
              type="text"
              bind:value={options.textColor}
              on:input={handleTextColorHexChange}
              placeholder="#FFFFFF"
              class="color-hex-input"
              pattern="#[0-9A-Fa-f]{6}"
            />
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Border Options -->
  <div class="form-field">
    <label class="checkbox-label">
      <input type="checkbox" bind:checked={options.hasBorder} />
      <span>Add text border/outline</span>
    </label>

    {#if options.hasBorder}
      <div class="mt-3 space-y-3">
        <div class="mt-2">
          <label for="borderColor" class="text-sm text-neutral-500"
            >Border Color</label
          >
          <div class="color-selector">
            <div class="color-options">
              <label class="color-option">
                <input
                  type="radio"
                  bind:group={selectedBorderColorRadio}
                  value="white"
                  on:change={() => handleBorderColorChange("white")}
                />
                <div class="color-preview white" />
                <span>White</span>
              </label>
              <label class="color-option">
                <input
                  type="radio"
                  bind:group={selectedBorderColorRadio}
                  value="black"
                  on:change={() => handleBorderColorChange("black")}
                />
                <div class="color-preview black" />
                <span>Black</span>
              </label>
              <label class="color-option">
                <input
                  type="radio"
                  bind:group={selectedBorderColorRadio}
                  value="custom"
                  on:change={() => handleBorderColorChange("custom")}
                />
                <div class="color-preview custom" />
                <span>Custom</span>
              </label>
            </div>
            {#if isCustomBorderColor}
              <div class="color-picker-wrapper mt-2">
                <label for="borderColorPicker" class="color-picker-label"
                  >Choose Color</label
                >
                <div class="color-picker-container">
                  <input
                    id="borderColorPicker"
                    type="color"
                    value={options.borderColor}
                    on:change={handleBorderColorPickerChange}
                    class="color-picker"
                  />
                  <input
                    type="text"
                    bind:value={options.borderColor}
                    on:input={handleBorderColorHexChange}
                    placeholder="#000000"
                    class="color-hex-input"
                    pattern="#[0-9A-Fa-f]{6}"
                  />
                </div>
              </div>
            {/if}
          </div>
        </div>
        <div>
          <label for="borderWidth">Border Width</label>
          <select id="borderWidth" bind:value={options.borderWidth}>
            {#each borderWidths as width}
              <option value={width.value}>{width.name}</option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .options-grid {
    @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
  }

  .form-field {
    @apply space-y-1.5;
  }

  label {
    @apply block text-sm text-neutral-500;
  }

  select {
    @apply w-full px-3 py-2 border border-neutral-300 rounded
           focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400
           bg-white text-neutral-900 cursor-pointer transition-colors;
  }

  .color-selector {
    @apply space-y-3;
  }

  .color-options {
    @apply flex gap-3 flex-wrap;
  }

  .color-option {
    @apply flex items-center gap-2 cursor-pointer text-sm text-neutral-700
           hover:text-black transition-colors;
  }

  .color-preview {
    @apply w-6 h-6 rounded border border-neutral-300;
  }

  .color-preview.white {
    @apply bg-white;
  }

  .color-preview.black {
    @apply bg-black;
  }

  .color-preview.custom {
    @apply bg-gradient-to-br from-red-500 via-blue-500 to-green-500;
  }

  .color-picker-wrapper {
    @apply space-y-2;
  }

  .color-picker-label {
    @apply text-sm text-neutral-500;
  }

  .color-picker-container {
    @apply flex gap-2 items-center;
  }

  .color-picker {
    @apply w-16 h-10 cursor-pointer rounded border border-neutral-300;
  }

  .color-hex-input {
    @apply flex-1 px-3 py-2 border border-neutral-300 rounded
           focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400
           bg-white text-neutral-900 font-mono text-sm;
  }

  .checkbox-label {
    @apply flex items-center gap-2 cursor-pointer text-sm text-neutral-700;
  }

  input[type="checkbox"],
  input[type="radio"] {
    @apply cursor-pointer;
  }

  input[type="radio"] {
    @apply w-4 h-4;
  }
</style>
