<script lang="ts">
  import Markdown from "$lib/components/Markdown.svelte";
  import { formatTime } from "$lib/utils";
  import { Utensils } from "lucide-svelte";

  type Photo = {
    title: string;
    date: Date;
    description: string;
    secondDescription?: string;
    link: string;
  };

  export let data: Photo[];
</script>

<!-- Description and image -->
<!-- <div class="space-y-4">
  {#each data as item}
    <img src={item.link} alt={item.title} title={item.title} />
    {item.description}
  {/each}
</div> -->

<!-- <div class="grid gap-y-4">
  {#each data as item}
    <a
      href={item.link}
      class="block -mx-3 px-3 py-2 hover:bg-neutral-100 transition-colors"
      target="_blank"
      rel="noreferrer"
    >
      <div class="text-lg text-black">
        {item.description}
      </div>
      <div class="text-lg leading-snug font-serif italic">
        {item.secondDescription}
      </div>
      <div class="sm:ml-auto mb-0.5 text-neutral-500">
        {formatTime("%B %-d, %Y", item.date)}
      </div>
    </a>
  {/each}
</div> -->
<div class="space-y-4">
  {#each data as item}
    <div class="grid grid-cols-3 gap-4 md:gap-8 lg:gap-12">
      <div class="col-span-2 md:col-span-1">
        <div class="text-lg text-black">
          {item.description}
        </div>
        <div class="text-lg leading-snug font-serif italic">
          {item.secondDescription}
        </div>
        <div class="sm:ml-auto mb-0.5 text-neutral-500">
          {formatTime("%B %-d, %Y", item.date)}
        </div>
      </div>
      <div class="col-span-2 md:col-span-2">
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src={item.link} />
      </div>
    </div>
  {/each}
</div>
