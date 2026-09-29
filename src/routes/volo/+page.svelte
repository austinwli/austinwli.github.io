<script lang="ts">
  import { onMount } from "svelte";
  import Seo from "$lib/components/Seo.svelte";

  // Unlisted route: deliberately absent from the nav in Header.svelte. That is
  // obscurity, not security -- so nothing here is secret. The worker URL and
  // token are entered once and kept in localStorage, which also keeps this
  // public bundle free of any reference to the bot's endpoint.
  const STORE_URL = "volo.workerUrl";
  const STORE_TOKEN = "volo.apiToken";

  let workerUrl = "";
  let apiToken = "";
  let connected = false;

  let state: any = null;
  let config: any = null;
  let next: any = null;
  let error = "";
  let busy = "";
  let saved = false;

  onMount(() => {
    workerUrl = localStorage.getItem(STORE_URL) ?? "";
    apiToken = localStorage.getItem(STORE_TOKEN) ?? "";
    if (workerUrl && apiToken) connect();
  });

  async function api(path: string, init: RequestInit = {}) {
    const res = await fetch(`${workerUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  }

  async function connect() {
    error = "";
    busy = "connecting";
    try {
      [state, config, next] = await Promise.all([
        api("/api/state"),
        api("/api/config"),
        api("/api/next"),
      ]);
      localStorage.setItem(STORE_URL, workerUrl);
      localStorage.setItem(STORE_TOKEN, apiToken);
      connected = true;
    } catch (e: any) {
      error = e.message;
      connected = false;
    } finally {
      busy = "";
    }
  }

  function disconnect() {
    localStorage.removeItem(STORE_URL);
    localStorage.removeItem(STORE_TOKEN);
    connected = false;
    state = config = next = null;
    apiToken = "";
  }

  async function saveConfig() {
    error = "";
    busy = "saving";
    saved = false;
    try {
      config = await api("/api/config", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      saved = true;
      setTimeout(() => (saved = false), 2500);
    } catch (e: any) {
      error = e.message;
    } finally {
      busy = "";
    }
  }

  async function dryRun() {
    error = "";
    busy = "running";
    try {
      await api("/api/run?dry=1", { method: "POST" });
      state = await api("/api/state");
    } catch (e: any) {
      error = e.message;
    } finally {
      busy = "";
    }
  }

  // Countdown to the next midnight-ET drop.
  let remaining = "";
  onMount(() => {
    const tick = setInterval(() => {
      if (!next?.fireAt) return;
      const ms = Date.parse(next.fireAt) - Date.now();
      if (ms <= 0) return (remaining = "now");
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      remaining = `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    }, 1000);
    return () => clearInterval(tick);
  });

  // Known venues, so filters can be picked rather than typed. Guessing
  // substrings fails silently — "Dobbins" never matches "100 Dobbin St".
  let venues: any[] | null = null;
  let venuesError = "";

  async function loadVenues() {
    venuesError = "";
    busy = "venues";
    try {
      const r = await api("/api/venues?days=28");
      venues = r.venues ?? [];
    } catch (e: any) {
      venuesError = e.message;
    } finally {
      busy = "";
    }
  }

  /**
   * Pull the venue out of a pickup title, which looks like
   * "Tuesday 10/6 - Volleyball Pickup (All Levels) - The Post BK - 100 Dobbin St 6:00pm".
   * Everything from the third segment on is the venue, since venue names can
   * themselves contain " - ".
   */
  function venueLabel(example: string | undefined) {
    if (!example) return "(unknown venue)";
    const tail = example.split(" - ").slice(2).join(" - ");
    return (tail || example).replace(/\s+\d{1,2}:\d{2}\s*(am|pm)?$/i, "").trim();
  }

  function toggleVenue(id: string) {
    const set = new Set<string>(config.venueIds ?? []);
    set.has(id) ? set.delete(id) : set.add(id);
    config.venueIds = [...set];
  }

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function toggleWeekday(i: number) {
    const set = new Set<number>(config.weekdays ?? []);
    set.has(i) ? set.delete(i) : set.add(i);
    config.weekdays = [...set].sort();
  }

  function listToText(v: string[] | undefined) {
    return (v ?? []).join(", ");
  }
  function textToList(v: string) {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
</script>

<Seo title="Volo" description="" />
<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="layout-md py-8">
  {#if !connected}
    <h2 class="heading2">Connect</h2>
    <p class="text-neutral-600 mb-4 text-sm">
      Enter the worker endpoint and its API token. Both are stored only in this
      browser.
    </p>
    <form class="space-y-3 max-w-md" on:submit|preventDefault={connect}>
      <input
        class="input"
        bind:value={workerUrl}
        placeholder="https://volo-bot.<subdomain>.workers.dev"
        autocomplete="off"
      />
      <input
        class="input"
        bind:value={apiToken}
        type="password"
        placeholder="API token"
        autocomplete="off"
      />
      <button class="btn" disabled={!workerUrl || !apiToken || busy === "connecting"}>
        {busy === "connecting" ? "Connecting…" : "Connect"}
      </button>
    </form>
    {#if error}<p class="err mt-3">{error}</p>{/if}
  {:else}
    <div class="flex items-baseline justify-between mb-6">
      <h2 class="heading2 mb-0">Volo</h2>
      <button class="text-sm text-neutral-500 hover:text-black" on:click={disconnect}>
        disconnect
      </button>
    </div>

    {#if error}<p class="err mb-4">{error}</p>{/if}

    <!-- Next drop -->
    <div class="card mb-6">
      <div class="flex justify-between items-baseline">
        <span class="label">Next drop</span>
        <span class="font-mono text-lg">{remaining || "—"}</span>
      </div>
      {#if next}
        <p class="text-sm text-neutral-600 mt-1">
          Registering for <strong>{next.targetDate}</strong> at midnight Eastern.
        </p>
      {/if}
      <div class="mt-3 flex gap-2">
        <button class="btn-sm" on:click={dryRun} disabled={busy === "running"}>
          {busy === "running" ? "Running…" : "Dry run"}
        </button>
        <span class="text-xs text-neutral-500 self-center">
          {config?.enabled ? "armed" : "disabled — enable below to claim for real"}
        </span>
      </div>
    </div>

    <!-- Settings -->
    <h3 class="heading2 text-base">Settings</h3>
    <div class="card mb-6 space-y-4">
      <label class="flex items-center gap-2">
        <input type="checkbox" bind:checked={config.enabled} />
        <span class="text-sm">Enabled — run at midnight</span>
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" bind:checked={config.dryRun} />
        <span class="text-sm">
          Dry run — do everything except actually claim
        </span>
      </label>

      <div>
        <span class="label">Days</span>
        <div class="flex flex-wrap gap-1 mt-1">
          {#each WEEKDAYS as day, i}
            <button
              type="button"
              class="chip"
              class:chip-on={(config.weekdays ?? []).includes(i)}
              on:click={() => toggleWeekday(i)}
            >
              {day}
            </button>
          {/each}
        </div>
        <p class="hint">None selected = any day.</p>
      </div>

      <div class="flex gap-3">
        <div class="flex-1">
          <span class="label">Earliest start</span>
          <input class="input" type="time" bind:value={config.startTimeFrom} />
        </div>
        <div class="flex-1">
          <span class="label">Latest start</span>
          <input class="input" type="time" bind:value={config.startTimeTo} />
        </div>
      </div>

      <div>
        <div class="flex items-baseline justify-between">
          <span class="label">Venues</span>
          <button
            type="button"
            class="text-xs text-neutral-500 hover:text-black"
            on:click={loadVenues}
            disabled={busy === "venues"}
          >
            {busy === "venues" ? "loading…" : venues ? "refresh" : "load venues"}
          </button>
        </div>

        {#if venuesError}
          <p class="err mt-1">{venuesError}</p>
        {:else if venues === null}
          <p class="hint">Load to see which venues are actually running.</p>
        {:else if !venues.length}
          <p class="hint">No pickups found in the next 4 weeks.</p>
        {:else}
          <div class="mt-1 space-y-1">
            {#each venues as v}
              <label class="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  class="mt-1"
                  checked={(config.venueIds ?? []).includes(v.venueId)}
                  on:change={() => toggleVenue(v.venueId)}
                />
                <span>
                  {venueLabel(v.examples?.[0])}
                  <span class="text-neutral-400 text-xs">
                    · {v.count} in 4 wks
                  </span>
                </span>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      <div>
        <span class="label">Or name contains</span>
        <input
          class="input"
          value={listToText(config.nameIncludes)}
          on:change={(e) => (config.nameIncludes = textToList(e.currentTarget.value))}
          placeholder="Baruch, Dobbin, Knickerbocker"
        />
        <p class="hint">
          For venues not currently running, so they can't be checked above.
          Comma separated, case-insensitive, any one matches. Use short
          substrings — "Dobbin" matches "100 Dobbin St", "Dobbins" does not.
        </p>
      </div>

      <p class="hint">
        Venues and names are OR'd — a pickup matching either is claimed. Day and
        time windows still apply on top. Leave both empty to allow any venue.
      </p>

      <div>
        <span class="label">Max per night</span>
        <input class="input w-24" type="number" min="1" bind:value={config.maxPerNight} />
      </div>

      <div class="flex items-center gap-3">
        <button class="btn" on:click={saveConfig} disabled={busy === "saving"}>
          {busy === "saving" ? "Saving…" : "Save"}
        </button>
        {#if saved}<span class="text-sm text-green-700">Saved</span>{/if}
      </div>
    </div>

    <!-- History -->
    <h3 class="heading2 text-base">Recent runs</h3>
    {#if !state?.runs?.length}
      <p class="text-sm text-neutral-500">No runs yet.</p>
    {:else}
      <ul class="space-y-2">
        {#each state.runs as run}
          <li class="card text-sm">
            <div class="flex justify-between">
              <span class="font-mono text-xs text-neutral-500">{run.started}</span>
              {#if run.skipped}
                <span class="text-neutral-400">skipped: {run.skipped}</span>
              {:else if run.claimed?.length}
                <span class="text-green-700">
                  {run.claimed.length} claimed{run.dryRun ? " (dry)" : ""}
                </span>
              {:else}
                <span class="text-red-700">nothing claimed</span>
              {/if}
            </div>
            {#if run.claimed?.length}
              <ul class="mt-1 text-neutral-700">
                {#each run.claimed as c}
                  <li>· {c.name ?? c.programId}</li>
                {/each}
              </ul>
            {/if}
            {#if run.errors?.length}
              <ul class="mt-1 text-red-700 text-xs">
                {#each run.errors as e}
                  <li>· {e}</li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style lang="postcss">
  .input {
    @apply w-full border border-neutral-300 rounded px-3 py-2 text-sm;
  }
  .btn {
    @apply bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40;
  }
  .btn-sm {
    @apply border border-neutral-300 rounded px-3 py-1 text-sm hover:border-black disabled:opacity-40;
  }
  .card {
    @apply border border-neutral-200 rounded-lg p-4;
  }
  .label {
    @apply text-xs uppercase tracking-wide text-neutral-500;
  }
  .hint {
    @apply text-xs text-neutral-500 mt-1;
  }
  .err {
    @apply text-sm text-red-700 break-all;
  }
  .chip {
    @apply border border-neutral-300 rounded px-2 py-1 text-xs;
  }
  .chip-on {
    @apply bg-black text-white border-black;
  }
</style>
