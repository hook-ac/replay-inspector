import { Events, hook } from "@/hooks";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { p, state } from "@/utils";

const keyPressed = () => {
  if (p.keyCode == 32) OsuRenderer.setPlaying(!OsuRenderer.playing);
};

const mouseWheel = (event: WheelEvent) => {
  if (event.ctrlKey) return;
  const currentState = state.getState();

  if (
    currentState.achivementsDialog ||
    currentState.dataAnalysisDialog ||
    currentState.metadataEditorDialog ||
    currentState.openDialog ||
    currentState.saveDialog
  )
    return;

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
