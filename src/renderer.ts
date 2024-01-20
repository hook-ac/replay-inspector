import { Vector } from "p5";
import {
  getBeatmap,
  getId,
  getMap,
  getReplay,
  loadImageAsync,
  p,
} from "./utils";
import { OsuRenderer } from "./osu/Renderer";
import { Drawer } from "./osu/Drawer";
export class Renderer {
  static mouse: Vector;
  static OsuRenderer: OsuRenderer = OsuRenderer;

  static async setup() {
    Drawer.setP(p);
    OsuRenderer.purge();

    // Fetch the images
    for (const imageName of Object.keys(Drawer.images)) {
      Drawer.images[imageName as keyof typeof Drawer.images] =
        await loadImageAsync(`/${imageName}.png`);
    }

    const replayBuffer = await (await fetch("./replay.osr")).arrayBuffer();
    const replay = await getReplay(replayBuffer);
    let hash = replay.info.beatmapHashMD5;
    const id = await getId(hash!);
    const map = await getMap(id);
    const beatmap = await getBeatmap(map, replay);
    OsuRenderer.setOptions(beatmap, replay);
  }

  static draw() {
    if (!OsuRenderer.beatmap) return;

    OsuRenderer.renderAtTime(0);
    p.circle(this.mouse.x, this.mouse.y, 25);
  }
}
