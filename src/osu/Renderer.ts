import { HitResult, LegacyReplayFrame, Score, Vector2 } from "osu-classes";
import { BeatmapDecoder, BeatmapEncoder } from "osu-parsers";
import {
  Circle,
  Slider,
  Spinner,
  StandardBeatmap,
  StandardHardRock,
  StandardHitObject,
  StandardModCombination,
  StandardRuleset,
} from "osu-standard-stable";
import { Drawer } from "./Drawer";
import { Vec2 } from "@osujs/math";
import { getBeatmap, getId, getMap, getReplay } from "@/utils";

export class OsuRenderer {
  private static preempt: number;
  private static fadeIn: number;

  static time: number;
  static beatmap: StandardBeatmap;
  static og_beatmap: StandardBeatmap;
  static replay: Score;
  static og_replay_mods: StandardModCombination;
  static forceHR: boolean | undefined = undefined;

  static loaded: boolean = false;

  static pathWindow: number = 500;

  static purge() {
    this.replay = undefined as any;
    this.beatmap = undefined as any;
  }

  static renderAtTime(time: number) {
    if (!this.beatmap || !this.replay) return;

    if (time >= this.replay.replay!.length - 500)
      time = this.replay.replay!.length - 500;

    this.setTime(time);
    for (let i = this.beatmap.hitObjects.length - 1; i >= 0; i--) {
      this.renderObject(this.beatmap.hitObjects[i]);
    }

    this.renderPath();
    Drawer.drawField();
  }

  static getOptions() {
    return {
      replay: this.replay,
      mods: this.replay.info.mods?.all,
      beatmap: this.og_beatmap,
    };
  }

  static setMetadata({ AR, CS, OD }: { AR: number; CS: number; OD: number }) {
    this.og_beatmap.difficulty.approachRate = AR;
    this.og_beatmap.difficulty.circleSize = CS;
    this.og_beatmap.difficulty.overallDifficulty = OD;
    const tempClone = this.og_beatmap.clone();
    let sendMods = this.replay.info.mods as StandardModCombination;
    const hasHardrock = sendMods.all.some((e) => e instanceof StandardHardRock);

    if (this.forceHR !== undefined) {
      if (hasHardrock !== this.forceHR) {
        this.replay.replay?.frames.forEach((frame) => {
          const f = frame as LegacyReplayFrame;
          f.position = new Vector2(f.position.x, 384 - f.position.y);
        });
      }
      if (this.forceHR) {
        if (!hasHardrock) {
          //@ts-ignore
          sendMods._mods.push(new StandardHardRock());
        }
      } else {
        //@ts-ignore
        sendMods._mods = sendMods._mods.filter(
          //@ts-ignore
          (e) => !(e instanceof StandardHardRock)
        );
      }
    }

    this.beatmap = this.recreateBeatmap(tempClone, sendMods);
    // GameplayAnalyzer.createBucket(this.replay, this.beatmap);

    let fadeIn = 0;
    let preempt = 0;
    if (this.beatmap!.difficulty.approachRate <= 5) {
      fadeIn = 800 + (400 * (5 - this.beatmap!.difficulty.approachRate)) / 5;
      preempt = 1200 + (600 * (5 - this.beatmap!.difficulty.approachRate)) / 5;
    } else {
      fadeIn = 800 - (500 * (this.beatmap!.difficulty.approachRate - 5)) / 5;
      preempt = 1200 - (750 * (this.beatmap!.difficulty.approachRate - 5)) / 5;
    }
    this.preempt = preempt;
    this.fadeIn = fadeIn;
  }

  static async loadReplayFromUrl(url: string) {
    OsuRenderer.purge();

    const replayBuffer = await (await fetch(url)).arrayBuffer();
    const replay = await getReplay(replayBuffer);
    let hash = replay.info.beatmapHashMD5;
    const id = await getId(hash!);
    const map = await getMap(id);
    const beatmap = await getBeatmap(map, replay);

    OsuRenderer.setOptions(beatmap, replay);
  }

  static setOptions(beatmap: StandardBeatmap, replay: Score) {
    this.forceHR = undefined;
    this.replay = replay;
    this.beatmap = beatmap;
    this.og_beatmap = beatmap.clone();
    this.og_replay_mods = replay.info.mods?.clone() as StandardModCombination;
    this.setMetadata({
      AR: this.beatmap.difficulty.approachRate,
      CS: this.beatmap.difficulty.circleSize,
      OD: this.beatmap.difficulty.overallDifficulty,
    });
  }

  private static setTime(time: number) {
    this.time = time;
  }

  private static renderObject(hitObject: StandardHitObject) {
    if (hitObject instanceof Circle) {
      this.renderCircle(hitObject);
    }

    if (hitObject instanceof Slider) {
      this.renderSlider(hitObject);
    }
  }

  private static calculateEffects(hitObject: StandardHitObject) {
    let vEndTime = hitObject.startTime;

    if (hitObject instanceof Slider || hitObject instanceof Spinner) {
      vEndTime = hitObject.endTime + 25;
    }

    const fadeOut = Math.max(
      0.0,
      (this.time - vEndTime) / hitObject.hitWindows.windowFor(HitResult.Meh)
    );

    let opacity = Math.max(
      0.0,
      Math.min(
        1.0,
        Math.min(
          1.0,
          (this.time - hitObject.startTime + this.preempt) / this.fadeIn
        ) - fadeOut
      )
    );

    const arScale = Math.max(
      1,
      ((hitObject.startTime - this.time) / this.preempt) * 3.0 + 1.0
    );

    let visible =
      this.time > hitObject.startTime - this.preempt &&
      this.time < vEndTime + hitObject.hitWindows.windowFor(HitResult.Meh);

    if (hitObject instanceof Slider && this.time > hitObject.endTime) {
      opacity -= (this.time - hitObject.endTime) / 25;
    }
    return {
      opacity,
      arScale,
      visible,
    };
  }

  private static renderCircle(hitObject: Circle) {
    if (hitObject.startTime > this.time + 10000) return;
    const { arScale, opacity, visible } = this.calculateEffects(hitObject);

    if (!visible) return;
    Drawer.beginDrawing();

    Drawer.setDrawingOpacity(opacity);

    Drawer.drawApproachCircle(
      hitObject.stackedStartPosition,
      hitObject.radius,
      arScale
    );
    Drawer.drawHitCircle(
      hitObject.stackedStartPosition,
      hitObject.radius,
      hitObject.currentComboIndex
    );

    // if (GameplayAnalyzer.renderJudgements[hitObject.startTime]) {
    //   Drawer.setDrawingOpacity(opacity / 2);

    //   Drawer.drawCircleJudgement(
    //     hitObject.stackedStartPosition,
    //     hitObject.radius,
    //     GameplayAnalyzer.renderJudgements[hitObject.startTime]
    //   );
    // }
    Drawer.endDrawing();
    return arScale;
  }

  private static renderSlider(hitObject: Slider) {
    if (hitObject.endTime > this.time + 10000) return;

    const { arScale, opacity, visible } = this.calculateEffects(hitObject);

    if (!visible) return;
    Drawer.beginDrawing();
    Drawer.setDrawingOpacity(opacity * 0.8);

    Drawer.drawSliderBody(
      hitObject.stackedStartPosition,
      hitObject.path.path,
      hitObject.radius
    );
    Drawer.setDrawingOpacity(opacity);

    Drawer.drawApproachCircle(
      hitObject.stackedStartPosition,
      hitObject.radius,
      arScale
    );
    Drawer.drawHitCircle(
      hitObject.stackedStartPosition,
      hitObject.radius,
      hitObject.currentComboIndex
    );

    let progress = (this.time - hitObject.startTime) / hitObject.duration;
    let position = hitObject.stackedStartPosition.add(
      hitObject.path.curvePositionAt(progress, hitObject.repeats + 1)
    );

    if (hitObject.repeats == 0) {
      position = hitObject.stackedStartPosition.add(
        hitObject.path.positionAt(progress)
      );
    }

    let sliderPos = new Vector2(position.x, position.y);

    if (this.time > hitObject.startTime && this.time < hitObject.endTime) {
      Drawer.drawSliderFollowPoint(sliderPos, hitObject.radius);
    }

    // if (GameplayAnalyzer.renderJudgements[hitObject.startTime]) {
    //   Drawer.setDrawingOpacity(opacity / 2);

    //   Drawer.drawCircleJudgement(
    //     hitObject.stackedStartPosition,
    //     hitObject.radius,
    //     GameplayAnalyzer.renderJudgements[hitObject.startTime]
    //   );
    // }
    Drawer.endDrawing();
    return arScale;
  }

  private static renderPath() {
    const frames = this.replay.replay!.frames as LegacyReplayFrame[];
    const renderFrames: {
      position: Vector2;
      button: {
        mouseLeft1: boolean;
        mouseLeft2: boolean;
        mouseRight1: boolean;
        mouseRight2: boolean;
      };
    }[] = [];
    let lastFrame: LegacyReplayFrame | undefined;
    let cursorPushed: any = false;
    for (const frame of frames) {
      if (frame.startTime > this.time) {
        if (!cursorPushed)
          cursorPushed = {
            position: this.interpolateReplayPosition(
              lastFrame ? lastFrame : frame,
              frame,
              this.time
            ),
            button: {
              mouseLeft1: frame.mouseLeft1,
              mouseLeft2: frame.mouseLeft2,
              mouseRight1: frame.mouseRight1,
              mouseRight2: frame.mouseRight2,
            },
          };
        if (frame.startTime > this.time + this.pathWindow) break;
      }
      if (frame.startTime < this.time - this.pathWindow) {
        continue;
      }
      lastFrame = frame;
      renderFrames.push({
        position: frame.position,
        button: {
          mouseLeft1: frame.mouseLeft1,
          mouseLeft2: frame.mouseLeft2,
          mouseRight1: frame.mouseRight1,
          mouseRight2: frame.mouseRight2,
        },
      });
    }

    Drawer.drawCursorPath(renderFrames, cursorPushed);

    return cursorPushed;
  }

  private static interpolateReplayPosition(
    fA: LegacyReplayFrame,
    fB: LegacyReplayFrame,
    time: number
  ): Vector2 {
    if (fB.startTime === fA.startTime) {
      return fA.position;
    } else {
      const p = (time - fA.startTime) / (fB.startTime - fA.startTime);
      const { x, y } = Vec2.interpolate(fA.position, fB.position, p);
      return new Vector2(x, y);
    }
  }

  private static recreateBeatmap(
    beatmap: StandardBeatmap,
    mods: StandardModCombination
  ) {
    const beatmapDecoder = new BeatmapDecoder();
    const beatmapEncoder = new BeatmapEncoder();
    const ruleset = new StandardRuleset();

    const bp = beatmapDecoder.decodeFromString(
      beatmapEncoder.encodeToString(beatmap)
    );
    return ruleset.applyToBeatmapWithMods(bp, mods as StandardModCombination);
  }
}
