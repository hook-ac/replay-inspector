import { Vector } from "p5";
import { p } from "./utils";
import { OsuRenderer } from "./osu/OsuRenderer";
import { Drawer } from "./osu/Drawer";

export class Renderer {
  static mouse: Vector;
  static OsuRenderer: OsuRenderer = OsuRenderer;

  static async setup() {
    Drawer.setP(p);

    await Drawer.loadDefaultImages();
    await OsuRenderer.loadReplayFromUrl("./replay.osr");
  }

  static draw() {
    if (!OsuRenderer.beatmap) return;

    OsuRenderer.setTime(OsuRenderer.time + 1);
    OsuRenderer.render();
    p.circle(this.mouse.x, this.mouse.y, 25);
  }
}
