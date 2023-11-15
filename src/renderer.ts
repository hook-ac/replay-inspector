import { Vector } from "p5";
import { p } from "./utils";
export class Renderer {
  static mouse: Vector;

  static draw() {
    p.circle(this.mouse.x, this.mouse.y, 25);
  }
}
