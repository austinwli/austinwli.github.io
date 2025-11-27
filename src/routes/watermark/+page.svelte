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
  import { DEFAULT_PATTERNS, getPatternByPhotoCount } from "./utils";
  import type {
    WatermarkConfig,
    AdvancedOptions as AdvancedOptionsType,
    ProcessingProgress,
    ImageAdjustment,
  } from "./types";
  import ImageEditorModal from "./ImageEditorModal.svelte";
  import { DEFAULT_IMAGE_ADJUSTMENT, cloneAdjustment } from "./imageTransforms";

  // State
  let selectedFiles: File[] = [];
  let selectedPhotoCount: 18 | 30 | 42 | 66 = 18;
  let imageAdjustments: ImageAdjustment[] = [];
  let previewOverrides: (string | null)[] = [];
  let editingIndex: number | null = null;
  let watermarkConfig: WatermarkConfig = {
    date: new Date().toISOString().split("T")[0],
    street: "",
    city: "",
    state: "",
    zip: "",
    timeRanges: [
      {
        id: crypto.randomUUID(),
        startTime: "10:00",
        incrementPattern: DEFAULT_PATTERNS[0], // 18 photos pattern
        photoCount: 18,
      },
    ],
  };
  let advancedOptions: AdvancedOptionsType = {
    position: "top-left",
    fontSize: "large",
    textColor: "white",
    hasBorder: false,
    borderColor: "black",
    borderWidth: "medium",
    bold: true,
  };
  let isProcessing = false;
  let progress: ProcessingProgress = { current: 0, total: 0, currentFile: "" };
  let errorMessage = "";

  // Reactive: Update time range when photo count changes
  $: if (selectedPhotoCount !== null && watermarkConfig.timeRanges.length > 0) {
    const range = watermarkConfig.timeRanges[0];
    if (range.photoCount !== selectedPhotoCount) {
      // Update pattern and photoCount, keep same id and startTime
      range.incrementPattern = getPatternByPhotoCount(selectedPhotoCount);
      range.photoCount = selectedPhotoCount;
      // Clear files when photo count changes
      selectedFiles = [];
      cleanupPreviewOverrides();
      imageAdjustments = [];
      errorMessage = "";
    }
  }

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
    const newAdjustments = newFiles.map(() => cloneAdjustment());
    imageAdjustments = [...imageAdjustments, ...newAdjustments];
    previewOverrides = [
      ...previewOverrides,
      ...new Array(newFiles.length).fill(null),
    ];
    errorMessage = "";
  }

  function handleRemove(event: CustomEvent<number>) {
    const index = event.detail;
    revokePreview(previewOverrides[index]);
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    imageAdjustments = imageAdjustments.filter((_, i) => i !== index);
    previewOverrides = previewOverrides.filter((_, i) => i !== index);
  }

  function handleReorder(event: CustomEvent<{ from: number; to: number }>) {
    const { from, to } = event.detail;

    // Validate indices
    if (
      from === to ||
      from < 0 ||
      from >= selectedFiles.length ||
      to < 0 ||
      to >= selectedFiles.length
    ) {
      return;
    }

    // Create new array and swap the two items (immutable update)
    const newFiles = [...selectedFiles];
    const newAdjustments = [...imageAdjustments];
    const newPreviews = [...previewOverrides];
    [newFiles[from], newFiles[to]] = [newFiles[to], newFiles[from]];
    [newAdjustments[from], newAdjustments[to]] = [
      newAdjustments[to],
      newAdjustments[from],
    ];
    [newPreviews[from], newPreviews[to]] = [newPreviews[to], newPreviews[from]];

    selectedFiles = newFiles;
    imageAdjustments = newAdjustments;
    previewOverrides = newPreviews;
    errorMessage = "";
  }

  function handleClearAll() {
    selectedFiles = [];
    cleanupPreviewOverrides();
    imageAdjustments = [];
    previewOverrides = [];
    errorMessage = "";
  }

  function handleEditRequest(event: CustomEvent<number>) {
    editingIndex = event.detail;
  }

  function handleAdjustmentSave(
    event: CustomEvent<{
      adjustment: ImageAdjustment;
      previewUrl?: string | null;
    }>
  ) {
    if (editingIndex === null) return;
    const index = editingIndex;
    const updated = event.detail.adjustment;
    imageAdjustments = imageAdjustments.map((adj, idx) =>
      idx === index ? updated : adj
    );
    if (event.detail.previewUrl) {
      previewOverrides = previewOverrides.map((url, idx) => {
        if (idx !== index) return url;
        if (url) URL.revokeObjectURL(url);
        return event.detail.previewUrl ?? null;
      });
    }
    editingIndex = null;
  }

  function closeEditor() {
    editingIndex = null;
  }

  function cleanupPreviewOverrides() {
    previewOverrides.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    previewOverrides = [];
  }

  function revokePreview(url?: string | null) {
    if (url) {
      URL.revokeObjectURL(url);
    }
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
        },
        imageAdjustments
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

<svelte:head>
  <link rel="stylesheet" href="https://use.typekit.net/evw2arl.css" />
</svelte:head>

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
      bind:selectedPhotoCount
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

    {#if (errorMessage || hasErrors) && selectedFiles.length > 0}
      <p class="text-sm text-neutral-600">
        {errorMessage || fileError || configError}
      </p>
    {/if}
  </div>
</div>

<!-- Break out of layout-md for wider image grid -->
<div class="image-grid-container">
  <ImageGrid
    files={selectedFiles}
    {imageAdjustments}
    {previewOverrides}
    onProcess={handleProcess}
    canProcess={canProcess && !hasErrors}
    config={watermarkConfig}
    on:remove={handleRemove}
    on:reorder={handleReorder}
    on:clearAll={handleClearAll}
    on:edit={handleEditRequest}
  />
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

{#if editingIndex !== null && selectedFiles[editingIndex]}
  {#key `${editingIndex}-${selectedFiles[editingIndex].name}-${imageAdjustments[editingIndex]?.rotation ?? 0}-${imageAdjustments[editingIndex]?.aspectRatio ?? "4:3"}-${imageAdjustments[editingIndex]?.crop ? `${imageAdjustments[editingIndex]?.crop?.x ?? 0}-${imageAdjustments[editingIndex]?.crop?.y ?? 0}-${imageAdjustments[editingIndex]?.crop?.width ?? 1}-${imageAdjustments[editingIndex]?.crop?.height ?? 1}` : "nocrop"}`}
    <ImageEditorModal
      file={selectedFiles[editingIndex]}
      adjustment={imageAdjustments[editingIndex] ?? DEFAULT_IMAGE_ADJUSTMENT}
      on:close={closeEditor}
      on:save={handleAdjustmentSave}
    />
  {/key}
{/if}

<style lang="postcss">
  .image-grid-container {
    @apply mx-auto max-w-[1152px] px-4 sm:px-6;
  }

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
