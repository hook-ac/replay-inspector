import { Events, hook } from "@/hooks";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { p } from "@/utils";

const keyPressed = () => {
  if (p.keyCode == 32) OsuRenderer.setPlaying(!OsuRenderer.playing);
};

export function hookOsuControls() {
  hook({ event: Events.keyPressed, callback: keyPressed });
}
