import { effect, signal } from "@angular/core";
import { z, ZodType } from "zod";

export function useLocalStorage<T extends ZodType>(key: string, schema: T) {
  type SchemaType = z.infer<T>;

  function save(value: SchemaType) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable, blocked by the browser or full.
    }
  }

  function load(): SchemaType | null {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) return null;
      const parsed = schema.safeParse(JSON.parse(serialized));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  return {
    save,
    load,
  };
}

export function localStorageSignal<T extends ZodType>(key: string, schema: T) {
  const instance = useLocalStorage(key, schema);

  const state = signal(instance.load());
  effect(() => {
    const value = state();
    if (value !== null) instance.save(value);
  });

  return state;
}
