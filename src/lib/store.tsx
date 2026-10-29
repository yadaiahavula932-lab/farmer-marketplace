import { useSyncExternalStore } from "react";
import { seed, type Role, type State } from "./market";

interface App extends State { role: Role; farmerId: string; }
const KEY = "harvest-market-v1";
const initial = (): App => ({ ...seed(), role: "buyer", farmerId: "f1" });
let state: App = initial();
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch { /* ignore */ }
}
export function update(fn: (s: App) => App) {
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  subs.forEach((f) => f());
}
export function resetDemo() { update(() => initial()); }
const serverSnap = initial();
export function useApp(): App {
  return useSyncExternalStore(
    (cb) => { load(); subs.add(cb); cb(); return () => subs.delete(cb); },
    () => state,
    () => serverSnap,
  );
}
