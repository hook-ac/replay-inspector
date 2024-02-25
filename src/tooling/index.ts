export class Tooling {
  static currentTool: Tool | undefined;

  static mousePressed() {
    if (!this.currentTool) return;
    this.currentTool.mousePressed();
  }

  static mouseReleased() {
    if (!this.currentTool) return;
    this.currentTool.mouseReleased();
  }

  static tick() {
    if (!this.currentTool) return;
    this.currentTool.tick();
  }

  static purge() {
    this.currentTool = undefined;
  }
}

export abstract class Tool {
  abstract mousePressed(): void;
  abstract mouseReleased(): void;
  abstract tick(): void;
}
