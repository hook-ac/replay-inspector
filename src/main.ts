import p5 from "p5";
import "./style.css";
import { p, setEnv } from "./utils";
import { Renderer } from "./renderer";

document.addEventListener("contextmenu", (event) => event.preventDefault());

async function main() {
  let multiplier = 1;
  let translation: p5.Vector;

  new p5(async (p5Instance) => {
    setEnv(p5Instance as unknown as p5);

    p.preload = () => {};

    p.setup = function setup() {
      p.createCanvas(this.windowWidth, this.windowHeight);
      multiplier = this.windowHeight / 384;
      p.imageMode(p.CENTER);
      p.frameRate(120);
      translation = p.createVector(0, 0);

      Renderer.mouse = p.createVector();
    };

    p.windowResized = function windowResized() {
      p.resizeCanvas(this.windowWidth, this.windowHeight);
    };

    p.draw = function draw() {
      p.cursor("default");
      if (drag) {
        p.cursor("grabbing");
      }

      p.background(0);
      p.scale(multiplier);
      p.translate(translation.x, translation.y);

      const translated = p.createVector(p.mouseX, p.mouseY);
      translated.mult(1 / multiplier);
      translated.sub(translation);
      Renderer.mouse.set(translated);

      Renderer.draw();

      p.translate(-translation.x, -translation.y);
      p.scale(1 / multiplier);
    };

    p.mouseWheel = function mouseWheel(event: any) {
      const zoom = event.delta > 0 ? 100 : -100;
      const oldScale = multiplier;
      const multiplierChange = zoom * 0.0008 * oldScale;
      multiplier -= multiplierChange;

      const newScale = multiplier;
      const mousePos = p.createVector(p.mouseX, p.mouseY);
      const mousePosScaled = mousePos.copy().div(oldScale);
      const mousePosScaledNew = mousePos.copy().div(newScale);
      const delta = mousePosScaledNew.copy().sub(mousePosScaled);
      translation.add(delta);

      return false;
    };

    let drag = false;
    let dragStart = p.createVector(0, 0);

    p.mousePressed = function mousePressed() {
      if (p.mouseButton === p.CENTER) {
        drag = true;
        dragStart = p.createVector(p.mouseX, p.mouseY);
      }
    };

    p.mouseDragged = function mouseDragged() {
      if (drag) {
        const mousePos = p.createVector(p.mouseX, p.mouseY);
        const delta = mousePos.copy().sub(dragStart).div(multiplier);
        translation.add(delta);
        dragStart = mousePos;
      }
    };
    p.mouseReleased = function mouseReleased() {
      drag = false;
    };
    p.keyPressed = function keyPressed() {};
    p.keyReleased = function keyReleased() {};
  }, document.getElementById("app")!);
}

main();
