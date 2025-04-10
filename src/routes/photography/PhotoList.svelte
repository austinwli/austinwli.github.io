<script lang="ts">
  type Photo = {
    title: string;
    date: Date;
    description: string;
    secondDescription?: string;
    link: string;
  };

  export let data: Photo[];
</script>

<!-- Images -->
<div class="space-y-4">
  <div class="grid grid-cols-2 gap-2 md:gap-2 lg:gap-2">
    {#each data as item}
      <div class="col-span-1 md:col-span-1">
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src={item.link} />
      </div>
    {/each}
  </div>
</div>
