import {
  Beatmap,
  BucketedGameStateTimeMachine,
  GameState,
  HitCircle,
  HitCircleVerdict,
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
  private static beatmap: Beatmap;
  private static bucket: BucketedGameStateTimeMachine;
  private static state: GameState;

  public static renderJudgements: Record<number, HitCircleVerdict["type"]> = {};

  static async refreshMap(beatmap: StandardBeatmap, score: Score) {
    // Completely tranforming to another format in order to analyze using @osujs/core
    // TODO: refactor to not reparse everything, but modify frames and stuff inplace.
    // TODO: optimize time-wise, currently eats up 70~ ish ms on large maps

    const beatmapRaw = await beatmapEncoder.encodeToString(beatmap);

    const extFrames: ReplayFrame[] = [
      { time: 0, actions: [0], position: { x: 0, y: 0 } },
      { time: 0, actions: [], position: { x: 0, y: 0 } },
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

    this.bucket = new BucketedGameStateTimeMachine(extFrames, this.beatmap, {
      noteLockStyle: "STABLE",
      hitWindowStyle: "OSU_STABLE",
    });
    this.state = this.bucket.gameStateAt(1e6);

    this.renderJudgements = {};
    for (const [objectId, judgement] of Object.entries(
      this.state.hitCircleVerdict
    )) {
      const object = this.beatmap.getHitObject(objectId);
      if (object instanceof HitCircle) {
        this.renderJudgements[object.hitTime] = judgement.type;
      }
    }
  }
}
