<script lang="ts">
  import { page } from "$app/stores";

  import { onMount } from "svelte";
  import { CalendarDays, Star } from "lucide-svelte";

  import Seo from "$lib/components/Seo.svelte";
  import Project from "./Project.svelte";

  const projects = import.meta.glob("../../projects/*.md", {
    eager: true,
  }) as any;
  const images = import.meta.glob("../../projects/*.{png,jpg,svg}", {
    eager: true,
  }) as any;

  function trimName(id: string) {
    return id.match(/\.\.\/projects\/(.*)\.md$/)?.[1];
  }

  $: projectsByDate = Object.keys(projects).sort(
    (a, b) => projects[b].date - projects[a].date
  );
  $: projectsByTitle = Object.keys(projects).sort((a, b) => {
    const titleA = projects[a].title.toLowerCase();
    const titleB = projects[b].title.toLowerCase();
    return titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
  });

  onMount(() => {
    // Hack: Fix the scroll position after the page loads, especially for mobile browsers.
    const selected = $page.url.hash.slice(1);
    if (selected) {
      setTimeout(() => {
        if ($page.url.hash.slice(1) === selected) {
          document.getElementById(selected)?.scrollIntoView();
        }
      }, 500);
    }
  });

  let stars: Record<string, number> | null = null;
  onMount(async () => {
    const resp = await fetch(
      "https://api.github.com/users/zestai/repos?per_page=100"
    );
    const repos = await resp.json();
    stars = {};
    for (const obj of repos) {
      stars[obj.full_name] = obj.stargazers_count;
    }
  });

  $: projectsByStars = [...projectsByTitle].sort((a, b) => {
    const starsA = stars?.[projects[a].repo] ?? 0;
    const starsB = stars?.[projects[b].repo] ?? 0;
    return starsB - starsA;
  });

  let sortOrder: "date" | "stars" = "date";
</script>

<Seo
  title="Austin Li – Projects"
  description="Projects in web development, machine learning, and more."
/>

<!-- <div class="bg-gray-900 text-neutral-200 dark">
  <section class="layout-md py-12">
    <h2 class="heading2 text-white">Table of Contents</h2>
    <ul class="sm:columns-2">
      {#each projectsByTitle as id (id)}
        <li>
          <a class="link" href="#{trimName(id)}">{projects[id].title}</a>
        </li>
      {/each}
    </ul>
  </section>
</div> -->

<!-- <div class="bg-neutral-50 border-b border-neutral-200 py-4">
  <div class="flex justify-center space-x-6">
    <button
      class:active={sortOrder === "date"}
      on:click={() => (sortOrder = "date")}
    >
      <CalendarDays size={18} strokeWidth={1.8} class="mr-1.5" /> by Date
    </button>
    <button
      class:active={sortOrder === "stars"}
      on:click={() => (sortOrder = "stars")}
    >
      <Star size={18} strokeWidth={1.8} class="mr-1.5" /> by Stars
    </button>
  </div>
</div> -->

<!-- {#each projectsByDate as id (id)} -->
{#each sortOrder === "date" ? projectsByDate : projectsByStars as id (id)}
  <section class="py-10" id={trimName(id)}>
    <div class="mx-auto max-w-[1152px] px-4 sm:px-6">
      <Project data={projects[id]} {images} {stars} />
    </div>
  </section>
{/each}

<style lang="postcss">
  button {
    @apply flex items-center text-neutral-400 transition-colors hover:text-black;
  }

  button.active {
    @apply text-black;
  }
</style>
