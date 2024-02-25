import { Hook } from "@/decorators/hook";
import { Events } from "@/hooks";
import { Tool } from "@/tooling/tool";

export class Tooling {
  static currentTool: Tool | undefined;

  @Hook(Events.mousePressed)
  static mousePressed() {
    if (!this.currentTool) return;
    this.currentTool.mousePressed();
  }

  @Hook(Events.mousePressed)
  static mouseReleased() {
    if (!this.currentTool) return;
    this.currentTool.mouseReleased();
  }

  @Hook(Events.draw)
  static tick() {
    if (!this.currentTool) return;
    this.currentTool.tick();
  }

  static purge() {
    this.currentTool = undefined;
  }
}
