<script lang="ts">
  type Photo = {
    title: string;
    date: Date;
    description: string;
    secondDescription?: string;
    crop?: string;
    link: string;
  };

  export let data: Photo[];
</script>

<!-- Images -->
<div class="space-y-4">
  <div class="grid grid-cols-1 gap-2 md:grid-cols-2 gap-2 lg:grid-cols-3 gap-2">
    <!-- <div class="col-span-2 md:col-span-1">
        <div class="text-lg text-black">
          {item.description}
        </div>
        <div class="text-lg leading-snug font-serif italic">
          {item.secondDescription}
        </div>
        <div class="sm:ml-auto mb-0.5 text-neutral-500">
          {formatTime("%B %-d, %Y", item.date)}
        </div>
      </div> -->
    {#each data as item}
      {#if item.crop == "letterbox"}
        <div class="col-span-1 md:col-span-2 lg:col-span-3">
          <!-- svelte-ignore a11y-missing-attribute -->
          <img src={item.link} />
        </div>
      {:else}
        <div class="col-span-1 md:col-span-1">
          <!-- svelte-ignore a11y-missing-attribute -->
          <img src={item.link} />
        </div>
      {/if}
    {/each}
  </div>
</div>
