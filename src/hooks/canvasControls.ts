import { Events, hook } from "@/hooks";
import { p } from "@/utils";
import p5 from "p5";

export let canvasDragging: boolean;
export let canvasDragStart: p5.Vector;
export let canvasMultiplier: number;
export let canvasTranslation: p5.Vector;

function setupCanvasControls() {
  canvasDragStart = p.createVector(0, 0);
  canvasDragging = false;
  canvasMultiplier = p.windowHeight / 384;
  canvasTranslation = p.createVector(0, 0);
}

const mousePressed = () => {
  if (p.mouseButton === p.CENTER) {
    canvasDragging = true;
    canvasDragStart = p.createVector(p.mouseX, p.mouseY);
  }
};

const mouseDragged = () => {
  if (canvasDragging) {
    const mousePos = p.createVector(p.mouseX, p.mouseY);
    const delta = mousePos.copy().sub(canvasDragStart).div(canvasMultiplier);
    canvasTranslation.add(delta);
    canvasDragStart = mousePos;
  }
};

const mouseReleased = () => {
  canvasDragging = false;
};

function mouseWheel(event: any) {
  if (!p.keyIsDown(17)) {
    return;
  }
  const zoom = event.deltaY > 0 ? 100 : -100;
  const oldScale = canvasMultiplier;
  const multiplierChange = zoom * 0.0008 * oldScale;
  canvasMultiplier -= multiplierChange;

  const newScale = canvasMultiplier;
  const mousePos = p.createVector(p.mouseX, p.mouseY);
  const mousePosScaled = mousePos.copy().div(oldScale);
  const mousePosScaledNew = mousePos.copy().div(newScale);
  const delta = mousePosScaledNew.copy().sub(mousePosScaled);
  canvasTranslation.add(delta);
  event.preventDefault();

  return false;
}

export function hookCanvasControls() {
  hook({ event: Events.setup, callback: setupCanvasControls });
  hook({ event: Events.mousePressed, callback: mousePressed });
  hook({ event: Events.mouseDragged, callback: mouseDragged });
  hook({ event: Events.mouseReleased, callback: mouseReleased });
  hook({ event: Events.mouseWheel, callback: mouseWheel });
}
