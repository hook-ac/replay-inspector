import { createStore } from "zustand/vanilla";
import p5 from "p5";

export const state = createStore<{}>(() => ({}));

export let p: p5;

export function setEnv(_p: p5) {
  p = _p;
}
