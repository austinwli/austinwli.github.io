<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Upload } from "lucide-svelte";

  export let disabled = false;

  const dispatch = createEventDispatcher<{ filesSelected: File[] }>();

  let isDragging = false;
  let fileInput: HTMLInputElement;

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    const files = Array.from(e.dataTransfer?.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      dispatch("filesSelected", imageFiles);
    }
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    if (files.length > 0) {
      dispatch("filesSelected", files);
    }

    // Reset input so the same files can be selected again if needed
    target.value = "";
  }

  function triggerFileSelect() {
    if (!disabled) {
      fileInput.click();
    }
  }

  function preventDefault(e: DragEvent) {
    e.preventDefault();
  }

  function handleDragEnter() {
    if (!disabled) {
      isDragging = true;
    }
  }

  function handleDragLeave(e: DragEvent) {
    // Only set isDragging to false if we're leaving the drop zone entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      isDragging = false;
    }
  }
</script>

<div
  class="upload-zone"
  class:drag-over={isDragging}
  class:disabled
  on:drop={handleDrop}
  on:dragover={preventDefault}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:click={triggerFileSelect}
  role="button"
  tabindex="0"
  on:keypress={(e) => e.key === "Enter" && triggerFileSelect()}
>
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    multiple
    on:change={handleFileSelect}
    class="hidden"
    {disabled}
  />

  <div class="content">
    <Upload size={32} class="mx-auto text-neutral-400" />
    <p class="text-neutral-700 text-sm sm:text-base">
      Drag & drop images here, or
      <button
        type="button"
        class="link"
        on:click|stopPropagation={triggerFileSelect}
        {disabled}
      >
        browse
      </button>
    </p>
    <p class="text-xs sm:text-sm text-neutral-500">Supports JPG, PNG, WebP</p>
  </div>
</div>

<style lang="postcss">
  .upload-zone {
    @apply border border-dashed border-neutral-300 rounded
           p-6 sm:p-12 transition-colors hover:bg-neutral-50 cursor-pointer
           min-h-[120px] sm:min-h-[160px] flex items-center justify-center;
  }

  .upload-zone.drag-over {
    @apply bg-neutral-100 border-neutral-400;
  }

  .upload-zone.disabled {
    @apply opacity-50 cursor-not-allowed hover:bg-transparent;
  }

  .content {
    @apply text-center space-y-2 sm:space-y-3 pointer-events-none;
  }

  .content button {
    @apply pointer-events-auto;
  }

  .hidden {
    @apply sr-only;
  }
</style>
