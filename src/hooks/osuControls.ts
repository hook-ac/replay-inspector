import { Hook } from "@/decorators/hook";
import { Events } from "@/hooks";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { Tooling } from "@/tooling";
import { p, state } from "@/utils";

export class OsuControlHooks {
  @Hook(Events.keyPressed)
  static keyPressed() {
    if (p.keyCode == 32) OsuRenderer.setPlaying(!OsuRenderer.playing);
  }

  @Hook(Events.mouseWheel)
  static mouseWheel(event: WheelEvent) {
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
  }

  @Hook(Events.mousePressed)
  static mousePressed(event: WheelEvent) {
    const currentState = state.getState();

    if (
      currentState.achivementsDialog ||
      currentState.dataAnalysisDialog ||
      currentState.metadataEditorDialog ||
      currentState.openDialog ||
      currentState.saveDialog
    )
      return;

    Tooling.mousePressed();
  }
}
