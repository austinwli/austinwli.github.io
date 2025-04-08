<script lang="ts">
  import Seo from "$lib/components/Seo.svelte";
  import WritingList from "./WritingList.svelte";
  import writing from "./writing.yaml";
</script>

<Seo
  title="Austin Li – Writing"
  description="Past writing: academic papers and notes."
/>

<div class="layout-md text-lg space-y-14">
  <div class="space-y-5">
    <p>
      In addition to the below, I also maintain a Substack publication <a
        class="link"
        href="https://austinli.substack.com/">Collection A</a
      >.
    </p>

    <p>
      Note that some <em>Notes and Public Goods</em> may not be complete.
    </p>
  </div>
</div>

<section class="layout-md py-12">
  <h2 class="heading2">Academic Writing</h2>
  <WritingList data={writing.papers} />
</section>

<section class="layout-md py-12">
  <h2 class="heading2">Notes and Public Goods</h2>
  <WritingList data={writing.notes} />
</section>
