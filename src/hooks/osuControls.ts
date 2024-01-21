import { Events, hook } from "@/hooks";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { p } from "@/utils";

const keyPressed = () => {
  if (p.keyCode == 32) OsuRenderer.setPlaying(!OsuRenderer.playing);
};

const mouseWheel = (event: WheelEvent) => {
  if (event.deltaY > 0) {
    OsuRenderer.setTime(OsuRenderer.time + 35);
  } else {
    OsuRenderer.setTime(OsuRenderer.time - 35);
  }
};

export function hookOsuControls() {
  hook({ event: Events.keyPressed, callback: keyPressed });
  hook({ event: Events.mouseWheel, callback: mouseWheel });
}
