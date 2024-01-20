import { Events, hook } from "@/hooks";
import { Renderer } from "@/renderer";
import { p } from "@/utils";
import {
  canvasDragging,
  canvasMultiplier,
  canvasTranslation,
} from "./canvasControls";

const preload = () => {};

const setup = () => {
  p.createCanvas(p.windowWidth, p.windowHeight);
  p.imageMode(p.CENTER);
  p.frameRate(120);
  Renderer.setup();
  Renderer.mouse = p.createVector();
};

const draw = () => {
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
};

const resize = () => {
  p.resizeCanvas(p.windowWidth, p.windowHeight);
};

export function hookP5Base() {
  hook({ event: Events.setup, callback: setup });
  hook({ event: Events.preload, callback: preload });
  hook({ event: Events.resize, callback: resize });
  hook({ event: Events.draw, callback: draw });
}
