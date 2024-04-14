import { p } from "@/utils";
import { Tool } from "./tool";
import { Singleton } from "@/decorators/singleton";
import { Renderer } from "@/renderer";
import { LegacyReplayFrame } from "osu-classes";
import { OsuRenderer } from "@/osu/OsuRenderer";

@Singleton
export class BrushTool extends Tool {
  private brushSize = 25
  private dragStartHorizontal: number | null = null;

  private noteList: LegacyReplayFrame[] = [];

  mousePressed(): void {
    if (p.mouseButton == p.LEFT) {
      const visibleFrames = OsuRenderer.getVisibleFrames()
      for (const frame of visibleFrames) {
        if (p.dist(frame.position.x, frame.position.y, Renderer.mouse.x, Renderer.mouse.y) < this.brushSize / 2) {
          this.noteList.push(frame)
        }
      }
    }
    if (p.mouseButton == p.RIGHT) {
      this.dragStartHorizontal = Renderer.mouse.x
    }
  }

  mouseReleased(): void {
    if (p.mouseButton == p.LEFT) {
      this.noteList = []
    }
    if (p.mouseButton == p.RIGHT && this.dragStartHorizontal) {
      this.brushSize = Math.abs(this.brushSize - (this.dragStartHorizontal - Renderer.mouse.x))
      this.dragStartHorizontal = null;
    }
  }

  tick(): void {
    if (this.dragStartHorizontal) {
      p.stroke(`rgba(255,0,0,0.6)`)
    }

    p.circle(Renderer.mouse.x, Renderer.mouse.y, this.brushSize - (this.dragStartHorizontal != null ? this.dragStartHorizontal - Renderer.mouse.x : 0))
  }
}
