<script lang="ts">
  import Seo from "$lib/components/Seo.svelte";
  import PhotoList from "./PhotoList.svelte";
  import photos from "./photos.yaml";
</script>

<Seo
  title="Austin Li – Photography"
  description="Some of my favorite photos."
/>

<div class="layout-md text-lg space-y-14">
  <div class="space-y-5">
    <p>
      Below are a few of my current favorite photos. My kit includes a Canon EOS
      R8 with a 50mm f/1.8 and 24-70mm f/2.8.
    </p>
  </div>
</div>

<section class="py-10">
  <div class="mx-auto max-w-[1152px] px-4 sm:px-6">
    <PhotoList data={photos.harvard} />
  </div>
</section>
