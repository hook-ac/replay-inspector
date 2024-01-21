import { Vector } from "p5";
import { p, state } from "./utils";
import { OsuRenderer, OsuRendererEvents } from "./osu/OsuRenderer";
import { Drawer } from "./osu/Drawer";
import { toast } from "sonner";

export class Renderer {
  static mouse: Vector;
  static OsuRenderer: OsuRenderer = OsuRenderer;

  static async setup() {
    Renderer.registerEvents();
    Drawer.setP(p);

    await Drawer.loadDefaultImages();
    await OsuRenderer.loadReplayFromUrl("./replay.osr");
  }

  static draw() {
    if (!OsuRenderer.beatmap) return;

    OsuRenderer.render();
    p.circle(this.mouse.x, this.mouse.y, 25);
  }

  static registerEvents() {
    // Sync UI with datapath classes
    OsuRenderer.event.on(OsuRendererEvents.UPDATE, () => {
      const options = OsuRenderer.getOptions();
      state.setState({
        beatmap: options.beatmap,
        replay: options.replay,
        mods: options.mods,
      });
    });

    OsuRenderer.event.on(OsuRendererEvents.LOAD, () => {
      toast(`Successfully loaded`, {
        description: `Played by ${OsuRenderer.replay.info.username}.`,
      });
    });
    OsuRenderer.event.on(OsuRendererEvents.PLAY, () => {
      state.setState({
        playing: OsuRenderer.playing,
      });
    });
    OsuRenderer.event.on(OsuRendererEvents.TIME, () => {
      state.setState({
        time: OsuRenderer.time,
      });
    });
  }
}
