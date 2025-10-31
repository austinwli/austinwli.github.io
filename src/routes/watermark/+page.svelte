<script lang="ts">
  import { Loader2 } from "lucide-svelte";
  import Seo from "$lib/components/Seo.svelte";
  import UploadZone from "./UploadZone.svelte";
  import ImageGrid from "./ImageGrid.svelte";
  import ConfigForm from "./ConfigForm.svelte";
  import AdvancedOptions from "./AdvancedOptions.svelte";
  import {
    processImages,
    validateFiles,
    validateConfig,
  } from "./processImages";
  import { downloadAsZip } from "./downloadZip";
  import { DEFAULT_PATTERNS, DEFAULT_PHOTO_COUNTS } from "./utils";
  import type {
    WatermarkConfig,
    AdvancedOptions as AdvancedOptionsType,
    ProcessingProgress,
  } from "./types";

  // State
  let selectedFiles: File[] = [];
  let watermarkConfig: WatermarkConfig = {
    date: new Date().toISOString().split("T")[0],
    street: "",
    city: "",
    state: "",
    zip: "",
    timeRanges: DEFAULT_PATTERNS.map((pattern, i) => ({
      id: crypto.randomUUID(),
      startTime: "10:00",
      incrementPattern: pattern,
      photoCount: DEFAULT_PHOTO_COUNTS[i],
    })),
  };
  let advancedOptions: AdvancedOptionsType = {
    position: "top-left",
    fontSize: "small",
    textColor: "white",
  };
  let isProcessing = false;
  let progress: ProcessingProgress = { current: 0, total: 0, currentFile: "" };
  let errorMessage = "";

  // Computed
  $: canProcess = selectedFiles.length > 0 && !isProcessing;
  $: fileError = selectedFiles.length > 0 ? validateFiles(selectedFiles) : null;
  $: configError = canProcess
    ? validateConfig(watermarkConfig, selectedFiles.length)
    : null;
  $: hasErrors = fileError !== null || configError !== null;

  // Handlers
  function handleFilesSelected(event: CustomEvent<File[]>) {
    const newFiles = event.detail;
    selectedFiles = [...selectedFiles, ...newFiles];
    errorMessage = "";
  }

  function handleRemove(event: CustomEvent<number>) {
    const index = event.detail;
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  }

  function handleClearAll() {
    selectedFiles = [];
    errorMessage = "";
  }

  async function handleProcess() {
    // Validate
    const fileValidation = validateFiles(selectedFiles);
    if (fileValidation) {
      errorMessage = fileValidation;
      return;
    }

    const configValidation = validateConfig(
      watermarkConfig,
      selectedFiles.length
    );
    if (configValidation) {
      errorMessage = configValidation;
      return;
    }

    errorMessage = "";
    isProcessing = true;

    try {
      const processedBlobs = await processImages(
        selectedFiles,
        watermarkConfig,
        advancedOptions,
        (p) => {
          progress = p;
        }
      );

      await downloadAsZip(processedBlobs, selectedFiles);

      // Success - optionally clear files or show success message
      // For now, we'll just keep the files so user can process again if needed
    } catch (error) {
      console.error("Processing failed:", error);
      errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process images. Please try again.";
    } finally {
      isProcessing = false;
      progress = { current: 0, total: 0, currentFile: "" };
    }
  }
</script>

<Seo
  title="Austin Li – Watermark Tool"
  description="Batch watermark images with timestamps. All processing happens in your browser."
/>

<div class="layout-md text-base sm:text-lg space-y-8 sm:space-y-14">
  <div class="space-y-3 sm:space-y-5">
    <p class="text-sm sm:text-base">
      Upload images and add timestamped watermarks. All processing happens in
      your browser — nothing is uploaded.
    </p>
  </div>

  <div class="space-y-4 sm:space-y-5">
    <ConfigForm
      bind:config={watermarkConfig}
      totalImages={selectedFiles.length}
    />
  </div>

  <div class="space-y-4 sm:space-y-5">
    <AdvancedOptions bind:options={advancedOptions} />
  </div>

  <div class="space-y-4 sm:space-y-5">
    <UploadZone
      disabled={isProcessing}
      on:filesSelected={handleFilesSelected}
    />
    <ImageGrid
      files={selectedFiles}
      onProcess={handleProcess}
      canProcess={canProcess && !hasErrors}
      config={watermarkConfig}
      on:remove={handleRemove}
      on:clearAll={handleClearAll}
    />

    {#if (errorMessage || hasErrors) && selectedFiles.length > 0}
      <p class="text-sm text-neutral-600">
        {errorMessage || fileError || configError}
      </p>
    {/if}
  </div>
</div>

{#if isProcessing}
  <div class="progress-overlay">
    <div class="progress-card">
      <Loader2 size={32} class="animate-spin text-neutral-600 mb-3 mx-auto" />
      <p class="text-lg font-medium text-black">Processing Images</p>
      <p class="text-sm text-neutral-600">
        {progress.current} of {progress.total}
      </p>
      <p
        class="text-xs text-neutral-500 mt-1 truncate max-w-xs mx-auto"
        title={progress.currentFile}
      >
        {progress.currentFile}
      </p>
      <div class="progress-bar-bg">
        <div
          class="progress-bar-fill"
          style="width: {progress.total > 0
            ? (progress.current / progress.total) * 100
            : 0}%"
        />
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  .progress-overlay {
    @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
  }

  .progress-card {
    @apply bg-white rounded-lg p-6 sm:p-8 text-center max-w-sm mx-4 w-full;
  }

  .progress-bar-bg {
    @apply w-full h-2 bg-neutral-200 rounded-full mt-4 overflow-hidden;
  }

  .progress-bar-fill {
    @apply h-full bg-black transition-all duration-300;
  }

  .progress-card p {
    @apply text-sm sm:text-lg;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
</style>
