<script lang="ts">
  import { untrack } from "svelte";
  import { originalSetTimeout } from "$lib/utils/freeze-animations.js";
  import styles from "./styles.module.scss";

  let { value, suffix }: { value: number; suffix?: string } = $props();

  let prev = $state<number | null>(null);
  let prevSuffix = $state<string | undefined>(untrack(() => suffix));
  let dir = $state<"up" | "down">("up");

  // useRef equivalents (mutable, non-reactive)
  let cur = untrack(() => value);
  let curSuffix = untrack(() => suffix);
  let timer: ReturnType<typeof originalSetTimeout> | undefined;

  const suffixChanged = $derived(prev !== null && prevSuffix !== suffix);

  $effect(() => {
    // track value + suffix
    const v = value;
    const sfx = suffix;
    if (v !== cur) {
      // Skip animation when hitting 0 — footer is about to collapse anyway
      if (v === 0) {
        cur = v;
        curSuffix = sfx;
        prev = null;
        return;
      }
      dir = v > cur ? "up" : "down";
      prev = cur;
      prevSuffix = curSuffix;
      cur = v;
      curSuffix = sfx;
      clearTimeout(timer);
      timer = originalSetTimeout(() => (prev = null), 250);
    } else {
      curSuffix = sfx;
    }
  });
</script>

{#if prev === null}
  {value}{suffix ? ` ${suffix}` : ""}
{:else if suffixChanged}
  <span class={styles.rollingWrap}>
    <span style="visibility: hidden">{value} {suffix}</span>
    <span class={`${styles.rollingNum} ${dir === "up" ? styles.exitUp : styles.exitDown}`}>{prev} {prevSuffix}</span>
    <span class={`${styles.rollingNum} ${dir === "up" ? styles.enterUp : styles.enterDown}`}>{value} {suffix}</span>
  </span>
{:else}
  <span class={styles.rollingWrap}>
    <span style="visibility: hidden">{value}</span>
    <span class={`${styles.rollingNum} ${dir === "up" ? styles.exitUp : styles.exitDown}`}>{prev}</span>
    <span class={`${styles.rollingNum} ${dir === "up" ? styles.enterUp : styles.enterDown}`}>{value}</span>
  </span>{suffix ? ` ${suffix}` : ""}
{/if}
