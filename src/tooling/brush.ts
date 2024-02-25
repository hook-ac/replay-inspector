import { Tool } from ".";
import { Singleton } from "@/decorators/singleton";

@Singleton
export class BrushTool extends Tool {
  mousePressed(): void {
    throw new Error("Method not implemented.");
  }
  mouseReleased(): void {
    throw new Error("Method not implemented.");
  }
  tick(): void {
    throw new Error("Method not implemented.");
  }
}
