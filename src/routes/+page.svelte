<script lang="ts">
  import { ArrowUpRight } from "lucide-svelte";

  import Seo from "$lib/components/Seo.svelte";
</script>

<Seo
  title="Austin Li"
  description="Software engineer, researcher, and designer. Making meaningful systems and interfaces for people."
/>

<p
  class="layout-md text-black text-xl leading-tight font-light mb-16"
  id="austin-is"
>
  <span class="g">is a</span> software engineer<span class="g">,</span><br />
  amateur physicist<span class="g">, and</span><br />
  <a href="/photography">photographer</a><span class="g">.</span>
</p>

<div class="layout-md text-lg space-y-14">
  <div class="space-y-5">
    <p>
      I currently work at <a class="link" href="https://usekoi.com">Koi</a>, an
      early stage fintech startup.
    </p>

    <p>
      I am passionate about building <em>social impact technology</em> — for education,
      finance, and government — to drive positive sustainable change through software.
    </p>
  </div>

  <div class="space-y-5">
    <p>
      Previously, I have had the opportunity to build mobile fraud and disputes
      features at
      <a class="link" href="https://www.capitalone.com/"> Capital One</a>, fair
      lending algorithms at
      <a class="link" href="https://www.zest.ai/"> Zest AI</a>, and NLP literacy
      tools at
      <a class="link" href="https://info.thinkcerca.com/core"> ThinkCerca</a>.
    </p>

    <p>
      I recently graduated from Harvard, where I was a teaching fellow for
      physics and CS classes, wrote a <a
        class="link"
        rel="external"
        href="/assets/pdf/Senior_Thesis.pdf"
        >thesis on quantum machine learning</a
      >, and studied philosophy, economics, and government.
    </p>

    <p>Other interests: math, pottery, reading, and volleyball.</p>

    <p>
      Template by <a class="link" href="https://www.ekzhang.com/">Eric Zhang</a
      >.
    </p>
  </div>
</div>

<style lang="postcss">
  .g {
    @apply text-neutral-400;
  }

  em {
    @apply font-serif text-[110%] leading-[100%];
  }

  .project-pair {
    @apply grid sm:grid-cols-[1fr,2fr] gap-y-1 -mx-3 px-3 py-2 hover:bg-neutral-100 transition-colors;
  }

  aside {
    @apply mt-0.5 text-base text-neutral-500;
  }

  /* Correction for vertical navigation links on mobile. */
  @media (max-width: 420px) {
    #austin-is {
      @apply -mt-10;
    }
  }
</style>
