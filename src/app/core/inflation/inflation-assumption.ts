import {
  computed,
  effect,
  inject,
  signal,
  untracked,
  type WritableSignal,
} from "@angular/core";
import { InflationService } from "./inflation.service";

/** Each form owns its mode. An input event switches mode even if the value is unchanged. */
export function useInflationAssumption<T extends { inflation: number }>(
  model: WritableSignal<T>,
  key: string,
  hasSavedValue = false,
) {
  const data = inject(InflationService);
  const storageKey = `${key}:inflation-mode`;
  let initialMode: "current" | "custom" = hasSavedValue ? "custom" : "current";
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved?.mode === "current") initialMode = "current";
    else if (saved?.mode === "custom" && Number.isFinite(saved.value)) {
      initialMode = "custom";
      model.update((v) => ({ ...v, inflation: saved.value }));
    }
  } catch {
    /* Unavailable storage uses the form's validated legacy value. */
  }
  const mode = signal(initialMode);
  const usable = computed(() => {
    const value = data.current()?.point.ratePercent;
    return value !== undefined && value >= -99 && value <= 100;
  });
  if (initialMode === "current")
    model.update((v) => ({
      ...v,
      inflation: usable() ? data.current()!.point.ratePercent : NaN,
    }));
  const ready = computed(() => mode() === "custom" || usable());
  effect(() => {
    const current = data.current();
    if (mode() === "current" && usable() && current)
      untracked(() =>
        model.update((v) => ({ ...v, inflation: current.point.ratePercent })),
      );
  });
  effect(() => {
    const selected = mode();
    const value = model().inflation;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          mode: selected,
          ...(selected === "custom" ? { value } : {}),
        }),
      );
    } catch {
      /* Storage is optional. */
    }
  });
  return {
    data,
    mode,
    ready,
    usable,
    custom: () => mode.set("custom"),
    useCurrent: () => {
      mode.set("current");
      model.update((v) => ({
        ...v,
        inflation: usable() ? data.current()!.point.ratePercent : NaN,
      }));
    },
  };
}
