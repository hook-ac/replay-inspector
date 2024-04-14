import { Hook } from "@/decorators/hook";
import { Events } from "@/hooks";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { p, state } from "@/utils";

export class OsuControlHooks {
  @Hook(Events.keyPressed)
  static keyPressed() {
    if (p.keyCode == 32) OsuRenderer.setPlaying(!OsuRenderer.playing);


    // Left Arrow
    if (p.keyCode == 37) {
      OsuRenderer.setTime(OsuRenderer.time - 25)
    }
    // Left Arrow
    if (p.keyCode == 39) {
      OsuRenderer.setTime(OsuRenderer.time + 25)
    }
    // Q Key
    if (p.keyCode == 81) {
      OsuRenderer.pathWindow = p.constrain(OsuRenderer.pathWindow - 50, 100, 2000)
    }
    // E Key
    if (p.keyCode == 69) {
      OsuRenderer.pathWindow = p.constrain(OsuRenderer.pathWindow + 50, 100, 2000)
    }
    // N Key
    if (p.keyCode == 78) {
      setTimeout(() => {
        state.setState(({ metadataEditorDialog }) => ({ metadataEditorDialog: !metadataEditorDialog }))
      })
    }
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
  }
}
