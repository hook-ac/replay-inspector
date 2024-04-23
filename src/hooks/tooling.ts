import { Hook } from "@/decorators/hook";
import { Events } from "@/hooks";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { BrushTool } from "@/tooling/brush";
import { Tool } from "@/tooling/tool";
import { p } from "@/utils";

export class Tooling {
  static currentTool: Tool | undefined;

  @Hook(Events.mousePressed)
  static mousePressed() {
    const overElements = document.querySelectorAll(":hover");
    const isOverCanvas =
      overElements[overElements.length - 1].id.includes("defaultCanvas");
    if (!Tooling.currentTool || !isOverCanvas) return;
    Tooling.currentTool.mousePressed();
  }

  @Hook(Events.mouseReleased)
  static mouseReleased() {
    if (!Tooling.currentTool) return;
    Tooling.currentTool.mouseReleased();
  }

  @Hook(Events.keyPressed)
  static keyPressed() {
    if (p.key == "2") {
      Tooling.currentTool = new BrushTool();
    }
    if (p.key == "1") {
      Tooling.currentTool = undefined;
    }
  }

  static tick() {
    if (!Tooling.currentTool || !OsuRenderer.beatmap || !OsuRenderer.replay)
      return;
    Tooling.currentTool.tick();
  }

  static purge() {
    Tooling.currentTool = undefined;
  }
}
