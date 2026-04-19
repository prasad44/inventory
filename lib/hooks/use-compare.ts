"use client";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "compareIds";
const MAX = 4;
const CHANGE_EVENT = "compare:change";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable
  }
}

// Cached snapshot so useSyncExternalStore's getSnapshot returns stable refs
// between events (otherwise React warns about infinite loops).
let cachedSnapshot: string[] = [];
let cachedKey = "";

function getSnapshot(): string[] {
  const current = read();
  const key = JSON.stringify(current);
  if (key !== cachedKey) {
    cachedSnapshot = current;
    cachedKey = key;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): string[] {
  return cachedSnapshot;
}

function subscribe(onChange: () => void): () => void {
  function handler(e: StorageEvent | Event) {
    // StorageEvent only fires cross-tab. CustomEvent handles same-tab.
    if (e instanceof StorageEvent && e.key !== STORAGE_KEY) return;
    onChange();
  }
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

export function useCompare() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const isFull = ids.length >= MAX;

  const toggle = useCallback(
    (id: string): { added: boolean; isFull: boolean } => {
      const cur = read();
      let next: string[];
      let added: boolean;
      if (cur.includes(id)) {
        next = cur.filter((x) => x !== id);
        added = false;
      } else {
        if (cur.length >= MAX) return { added: false, isFull: true };
        next = [...cur, id];
        added = true;
      }
      write(next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return { added, isFull: false };
    },
    []
  );

  const clear = useCallback(() => {
    write([]);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { ids, has, isFull, count: ids.length, toggle, clear, max: MAX };
}
