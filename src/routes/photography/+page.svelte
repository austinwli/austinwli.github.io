<script lang="ts">
  import Seo from "$lib/components/Seo.svelte";
  import PhotoCarousel from "./PhotoCarousel.svelte";
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

<section>
  <!-- <div class="mx-auto max-w-[1553px] px-4 sm:px-6">
    <PhotoList data={photos} />
  </div> -->
  <div class="mx-auto max-w-[1152px]">
    <PhotoCarousel data={photos} />
  </div>
</section>
