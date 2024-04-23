import { p } from "@/utils";
import { Tool } from "./tool";
import { Singleton } from "@/decorators/singleton";
import { Renderer } from "@/renderer";
import { LegacyReplayFrame } from "osu-classes";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { GameplayAnalyzer } from "@/osu/GameplayAnalyzer";

interface LegacyModEntry {
  frame: LegacyReplayFrame;
  start_mouse: { x: number; y: number };
  start_point: { x: number; y: number };
  rate: number;
}

@Singleton
export class BrushTool extends Tool {
  private brushSize = 25;
  private dragStartHorizontal: number | null = null;

  private noteList: LegacyModEntry[] = [];

  mousePressed(): void {
    if (p.mouseButton == p.LEFT) {
      const visibleFrames = OsuRenderer.getVisibleFrames();
      for (const frame of visibleFrames) {
        if (
          p.dist(
            frame.position.x,
            frame.position.y,
            Renderer.mouse.x,
            Renderer.mouse.y
          ) <
          this.brushSize / 2
        ) {
          this.noteList.push({
            frame,
            rate:
              1 -
              p.dist(
                Renderer.mouse.x,
                Renderer.mouse.y,
                frame.position.x,
                frame.position.y
              ) /
                (this.brushSize / 2),
            start_mouse: { x: Renderer.mouse.x, y: Renderer.mouse.y },
            start_point: { x: frame.position.x, y: frame.position.y },
          });
        }
      }
    }
    if (p.mouseButton == p.RIGHT) {
      this.dragStartHorizontal = Renderer.mouse.x;
    }
  }

  mouseReleased(): void {
    if (p.mouseButton == p.LEFT) {
      if (this.noteList.length) {
        GameplayAnalyzer.refreshMap(OsuRenderer.beatmap, OsuRenderer.replay);
      }
      this.noteList = [];
    }
    if (p.mouseButton == p.RIGHT && this.dragStartHorizontal) {
      this.brushSize = Math.abs(
        this.brushSize - (this.dragStartHorizontal - Renderer.mouse.x)
      );
      this.dragStartHorizontal = null;
    }
  }

  tick(): void {
    if (this.dragStartHorizontal) {
      p.stroke(`rgba(255,0,0,0.6)`);
    }

    if (this.noteList) {
      for (const modFrame of this.noteList) {
        modFrame.frame.position.x =
          modFrame.start_point.x +
          (Renderer.mouse.x - modFrame.start_mouse.x) * modFrame.rate;
        modFrame.frame.position.y =
          modFrame.start_point.y +
          (Renderer.mouse.y - modFrame.start_mouse.y) * modFrame.rate;
      }
    }

    p.push();
    const visibleFrames = OsuRenderer.getVisibleFrames();
    p.noStroke();
    for (const frame of visibleFrames) {
      if (
        p.dist(
          frame.position.x,
          frame.position.y,
          Renderer.mouse.x,
          Renderer.mouse.y
        ) <
        this.brushSize / 2
      ) {
        p.fill("red");
        p.circle(frame.position.x, frame.position.y, 1);
      }
    }
    p.pop();

    p.circle(
      Renderer.mouse.x,
      Renderer.mouse.y,
      this.brushSize -
        (this.dragStartHorizontal != null
          ? this.dragStartHorizontal - Renderer.mouse.x
          : 0)
    );
  }
}
