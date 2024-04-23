import {
  normalizeHitObjects,
  osuClassicScoreScreenJudgementCount,
} from "@/utils";
import {
  Beatmap,
  BucketedGameStateTimeMachine,
  OsuAction,
  ReplayFrame,
  buildBeatmap,
  parseBlueprint,
} from "@osujs/core";
import { LegacyReplayFrame, Score } from "osu-classes";
import { BeatmapEncoder } from "osu-parsers";
import { StandardBeatmap } from "osu-standard-stable";
const beatmapEncoder = new BeatmapEncoder();

export class GameplayAnalyzer {
  private static objectDictionary: any;
  private static beatmap: Beatmap;
  private static bucket: BucketedGameStateTimeMachine;
  private static lastHits = [0, 0, 0, 0];

  static async refreshMap(beatmap: StandardBeatmap, score: Score) {
    // Completely tranforming to another format in order to analyze using @osujs/core
    // TODO: refactor to not reparse everything, but modify frames and stuff inplace.

    const beatmapRaw = await beatmapEncoder.encodeToString(beatmap);

    const extFrames: ReplayFrame[] = [
      { time: 565, actions: [0], position: { x: 0, y: 0 } },
      { time: 585, actions: [], position: { x: 0, y: 0 } },
    ];

    (score.replay?.frames as LegacyReplayFrame[]).forEach((frame) => {
      const lastFrame: ReplayFrame = {
        time: frame.startTime,
        actions: [],
        position: { x: frame.position.x, y: frame.position.y },
      };

      if (frame.mouseLeft) {
        lastFrame.actions.push(OsuAction.leftButton);
      }
      if (frame.mouseRight) {
        lastFrame.actions.push(OsuAction.rightButton);
      }

      extFrames.push(lastFrame);
    });

    const bp = parseBlueprint(beatmapRaw);
    this.beatmap = buildBeatmap(bp);
    console.time();

    this.lastHits = [0, 0, 0, 0];
    this.objectDictionary = normalizeHitObjects(this.beatmap.hitObjects);

    this.bucket = new BucketedGameStateTimeMachine(extFrames, this.beatmap, {
      noteLockStyle: "STABLE",
      hitWindowStyle: "OSU_STABLE",
    });
    const state = this.bucket.gameStateAt(1e6);

    const judge = osuClassicScoreScreenJudgementCount(
      state,
      this.beatmap.hitObjects
    );
    console.timeEnd();

    console.log(judge);
  }
}
