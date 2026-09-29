<script lang="ts">
  type Run = {
    started?: string;
    finished?: string;
    date?: string;
    dryRun?: boolean;
    manual?: boolean;
    skipped?: string;
    claimed?: { name?: string; programId?: string; status?: string }[];
    errors?: string[];
    subrequests?: number;
    pollAttempts?: number;
  };

  export let runs: Run[] = [];
  export let limit = 5;

  // The worker keeps 30, but the page only needs the recent ones -- and the
  // list scrolls rather than growing the page.
  $: shown = (runs ?? []).slice(0, limit);

  function when(iso: string | undefined) {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.valueOf())
      ? iso
      : d.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  }

  // A run that wakes on the wrong cron, or finds nothing matching, is working
  // as intended -- only errors beyond that are worth flagging in red.
  function summarize(run: Run) {
    if (run.skipped) return { text: `skipped · ${run.skipped}`, tone: "quiet" };
    if (run.claimed?.length) {
      return {
        text: `${run.claimed.length} claimed${run.dryRun ? " (dry)" : ""}`,
        tone: "good",
      };
    }
    const onlyNoMatch =
      run.errors?.length === 1 && run.errors[0] === "no matching pickups found";
    if (onlyNoMatch) return { text: "no matches", tone: "quiet" };
    if (run.errors?.length) return { text: "failed", tone: "bad" };
    return { text: "nothing claimed", tone: "quiet" };
  }
</script>

{#if !shown.length}
  <p class="text-sm text-neutral-500">No runs yet.</p>
{:else}
  <ul class="scroller">
    {#each shown as run}
      {@const s = summarize(run)}
      <li class="run">
        <div class="flex justify-between items-baseline gap-2">
          <span class="text-xs text-neutral-500">
            {when(run.started)}
            {#if run.manual}<span class="text-neutral-400">· manual</span>{/if}
          </span>
          <span
            class="text-xs whitespace-nowrap"
            class:good={s.tone === "good"}
            class:bad={s.tone === "bad"}
            class:quiet={s.tone === "quiet"}
          >
            {s.text}
          </span>
        </div>

        {#if run.date}
          <p class="text-xs text-neutral-400">for {run.date}</p>
        {/if}

        {#if run.claimed?.length}
          <ul class="mt-1 text-sm text-neutral-700">
            {#each run.claimed as c}
              <li>· {c.name ?? c.programId}</li>
            {/each}
          </ul>
        {/if}

        {#if run.errors?.length}
          <ul class="mt-1 text-xs text-red-700">
            {#each run.errors.slice(0, 3) as e}
              <li>· {e}</li>
            {/each}
            {#if run.errors.length > 3}
              <li class="text-neutral-400">
                · and {run.errors.length - 3} more
              </li>
            {/if}
          </ul>
        {/if}

        {#if run.subrequests}
          <p class="text-xs text-neutral-400 mt-1">
            {run.subrequests}/50 subrequests{#if run.pollAttempts}, {run.pollAttempts}
              polls{/if}
          </p>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style lang="postcss">
  .scroller {
    @apply max-h-80 overflow-y-auto space-y-2 pr-1;
  }

  .run {
    @apply border border-neutral-200 rounded-lg p-3;
  }

  .good {
    @apply text-green-700;
  }

  .bad {
    @apply text-red-700;
  }

  .quiet {
    @apply text-neutral-500;
  }
</style>
