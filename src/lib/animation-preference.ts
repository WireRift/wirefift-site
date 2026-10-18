"use client";

import { useSyncExternalStore } from "react";

export const ANIMATION_STORAGE_KEY = "wirerift-animations";
const CHANGE_EVENT = "wirerift:animations";
let localPreference: boolean | undefined;

function snapshot() {
  if (localPreference !== undefined) return localPreference;
  try {
    const saved = localStorage.getItem(ANIMATION_STORAGE_KEY);
    if (saved === "on" || saved === "off") return saved === "on";
  } catch {
    // A denied storage API must not disable the control in this tab.
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  function storage(event: StorageEvent) {
    if (event.key === ANIMATION_STORAGE_KEY || event.key === null) {
      localPreference = undefined;
      notify();
    }
  }
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener("storage", storage);
  media.addEventListener("change", notify);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener("storage", storage);
    media.removeEventListener("change", notify);
  };
}

function setEnabled(enabled: boolean) {
  localPreference = enabled;
  try {
    localStorage.setItem(ANIMATION_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // The in-memory preference still works when storage is unavailable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const serverSnapshot = () => false;

/** Persisted preference controls pointer effects, never ambient motion. */
export function usePointerEffects() {
  const enabled = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return [enabled, setEnabled] as const;
}

function subscribeMotion(notify: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function ambientSnapshot() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAmbientMotion() {
  return useSyncExternalStore(subscribeMotion, ambientSnapshot, serverSnapshot);
}
