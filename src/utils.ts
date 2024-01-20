import { BeatmapDecoder } from "osu-parsers";
import { ScoreDecoder } from "../osu-parsers";
import { StandardRuleset, StandardBeatmap } from "osu-standard-stable";
import {
  BucketedGameStateTimeMachine,
  parseReplayFramesFromRaw,
  parseBlueprint,
  buildBeatmap,
  Slider,
  OsuHitObject,
  AllHitObjects,
} from "@osujs/core";

import { createStore } from "zustand/vanilla";
import { ReplayButtonState, Score } from "osu-classes";
import { GameState } from "@osujs/core/gameplay/GameState";
import p5, { Image } from "p5";

const ruleset = new StandardRuleset();
const scoreDecoder = new ScoreDecoder();
const beatmapDecoder = new BeatmapDecoder();
export async function getMap(id: number) {
  const req = await fetch(
    `https://editor-playground-ten.vercel.app/api/getId?id=${id}`
  );
  return await req.text();
}

export async function getId(hash: string) {
  const endpoint = `https://editor-playground-ten.vercel.app/api/getMap?hash=${hash}`;
  const req = await fetch(endpoint);
  const json = await req.text();
  return Number(json);
}

export async function getReplay(buffer: ArrayBuffer) {
  const repl = await scoreDecoder.decodeFromBuffer(buffer);
  repl.info.ruleset = ruleset;
  return repl;
}

export const encodeFrames = (frames: any, beatmap: any) => {
  const encoded: any[] = [];

  if (frames) {
    let lastTime = 0;

    frames.forEach((frame: any) => {
      let _a, _b, _c;
      const time = Math.round(frame.startTime);
      const legacyFrame: any = frame;
      const encodedData = [
        time - lastTime,
        (_a =
          legacyFrame === null || legacyFrame === void 0
            ? void 0
            : legacyFrame.mouseX) !== null && _a !== void 0
          ? _a
          : 0,
        (_b =
          legacyFrame === null || legacyFrame === void 0
            ? void 0
            : legacyFrame.mouseY) !== null && _b !== void 0
          ? _b
          : 0,
        (_c =
          legacyFrame === null || legacyFrame === void 0
            ? void 0
            : legacyFrame.buttonState) !== null && _c !== void 0
          ? _c
          : ReplayButtonState.None,
      ];

      encoded.push(encodedData.join("|"));
      lastTime = time;
    });

    encoded.push("-12345|0|0|0");

    return encoded.join(",");
  }
};

export function normalizeHitObjects(
  hitObjects: OsuHitObject[]
): Record<string, AllHitObjects> {
  const hitObjectById: Record<string, AllHitObjects> = {};
  hitObjects.forEach((h) => {
    hitObjectById[h.id] = h;
    if (h instanceof Slider) {
      hitObjectById[h.head.id] = h.head;
      for (const c of h.checkPoints) {
        hitObjectById[c.id] = c;
      }
    }
  });
  return hitObjectById;
}

export function osuClassicScoreScreenJudgementCount(
  state: GameState,
  hitObjects: OsuHitObject[]
) {
  const count: any = [0, 0, 0, 0];
  const dict = normalizeHitObjects(hitObjects);
  const HitObjectVerdicts = {
    GREAT: 0,
    OK: 1,
    MEH: 2,
    MISS: 3,
  } as const;

  for (const s of Object.values(state.hitCircleVerdict)) {
    count[HitObjectVerdicts[s.type]]++;
  }

  for (const id in state.sliderVerdict) {
    const j = state.sliderVerdict[id];
    count[HitObjectVerdicts[j]]++;
    const slider = dict[id] as Slider;

    // In osu!classic the heads are not counted and we just subtract them
    const headState = state.hitCircleVerdict[slider.head.id];
    if (!headState) throw Error("Head state was not calculated?");
    count[HitObjectVerdicts[headState.type]]--;
  }

  return count;
}

export async function getAlternativeReplay(replay: Score, beatmap: string) {
  const rawFrames = encodeFrames(replay.replay?.frames, null) as string;
  let result = parseReplayFramesFromRaw(rawFrames);
  const bp = parseBlueprint(beatmap);
  const ojsBeatmap = buildBeatmap(bp);
  const bucket = new BucketedGameStateTimeMachine(result, ojsBeatmap, {
    noteLockStyle: "STABLE",
    hitWindowStyle: "OSU_STABLE",
  });
  bucket.gameStateAt(1e6);
  console.timeEnd();

  return { bucket, ojsBeatmap };
}

export async function getBeatmap(mapText: string, scoreBase: Score) {
  const map = beatmapDecoder.decodeFromString(mapText);

  const score = scoreBase.info;
  score.accuracy =
    (score.count300 + score.count100 / 3 + score.count50 / 6) /
    (score.count300 + score.count100 + score.count50 + score.countMiss);

  return ruleset.applyToBeatmap(map);
}

export async function loadImageAsync(image: string): Promise<Image> {
  return new Promise((res) => {
    p.loadImage(image, (img) => {
      res(img);
    });
  });
}

export const state = createStore<{
  beatmap: StandardBeatmap | null;
  replay: Score | null;
}>(() => ({
  beatmap: null,
  replay: null,
}));

export let p: p5;

export function setEnv(_p: p5) {
  p = _p;
}
