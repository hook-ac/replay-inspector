import p5 from "p5";
import { create } from "zustand";

export const state = create<{}>(() => ({}));

export let p: p5;

export function setEnv(_p: p5) {
  p = _p;
}
