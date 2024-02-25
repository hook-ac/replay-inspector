import { Events, hook } from "@/hooks";
import { Renderer } from "@/renderer";
import { p } from "@/utils";
import {
  canvasDragging,
  canvasMultiplier,
  canvasTranslation,
} from "./canvasControls";
import { Hook } from "@/decorators/hook";

export class p5Hooks {
  @Hook(Events.setup)
  static setup() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.imageMode(p.CENTER);
    p.frameRate(120);
    Renderer.setup();
    Renderer.mouse = p.createVector();
  }

  @Hook(Events.draw)
  static draw() {
    p.cursor("default");
    if (canvasDragging) {
      p.cursor("grabbing");
    }

    p.background(0);
    p.scale(canvasMultiplier);
    p.translate(canvasTranslation.x, canvasTranslation.y);

    const translated = p.createVector(p.mouseX, p.mouseY);
    translated.mult(1 / canvasMultiplier);
    translated.sub(canvasTranslation);
    Renderer.mouse.set(translated);

    Renderer.draw();

    p.translate(-canvasTranslation.x, -canvasTranslation.y);
    p.scale(1 / canvasMultiplier);
  }

  @Hook(Events.resize)
  static resize() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  }
}
