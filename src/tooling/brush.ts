import { p } from "@/utils";
import { Tool } from "./tool";
import { Singleton } from "@/decorators/singleton";
import { Renderer } from "@/renderer";

@Singleton
export class BrushTool extends Tool {
  private brushSize = 25
  private dragStartHorizontal: number | null = null;
  mousePressed(): void {
    if (p.mouseButton == p.LEFT) {

    }
    if (p.mouseButton == p.RIGHT) {
      this.dragStartHorizontal = Renderer.mouse.x
      console.log(this.dragStartHorizontal)
    }
  }
  mouseReleased(): void {
    if (p.mouseButton == p.LEFT) {

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
