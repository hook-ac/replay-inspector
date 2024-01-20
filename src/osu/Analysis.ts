import { modsFromBitmask } from "@osujs/core";
import { LegacyReplayFrame, Score } from "osu-classes";
import {
  Circle,
  StandardBeatmap,
  StandardHitObject,
} from "osu-standard-stable";

export function getHoldAverages(
  formattedPresses: {
    start: number;
    end: number | null;
    duration: number;
    object: null;
  }[],
  map: StandardBeatmap
) {
  const circlePresses: {
    start: number;
    pressStart: number;
    holdTime: number;
  }[] = [];
  const sliderPresses: {
    start: number;
    pressStart: number;
    holdTime: number;
  }[] = [];

  let circleHitAverage = 0;
  let circleLength = 0;
  let circleExtremes = { max: 0, min: 0 };

  let sliderDeltaHoldAverage = 0;
  let sliderLength = 0;
  let sliderExtremes = { max: 0, min: 0 };

  for (const press of formattedPresses) {
    let closestObject: StandardHitObject = map.hitObjects[0];
    for (const object of map.hitObjects) {
      if (
        Math.abs(press.start - object.startTime) <
        Math.abs(press.start - closestObject.startTime)
      ) {
        closestObject = object;
      }
    }
    press.object = closestObject as any;
    if (closestObject instanceof Circle) {
      circleHitAverage += press.duration;
      circleLength++;

      if (press.duration < 160) {
        circlePresses.push({
          start: closestObject.startTime,
          pressStart: press.start,
          holdTime: press.duration,
        });
        if (press.duration > circleExtremes.max) {
          circleExtremes.max = press.duration;
        }
        if (press.duration < circleExtremes.min) {
          circleExtremes.min = press.duration;
        }
      }
    }

    if ((closestObject as any).duration) {
      if (press.duration && (closestObject as any).duration) {
        let sval = press.duration - (closestObject as any).duration;
        sliderDeltaHoldAverage += sval;
        sliderLength++;

        sliderPresses.push({
          start: closestObject.startTime,
          pressStart: press.start,
          holdTime: sval,
        });

        if (sval > sliderExtremes.max) {
          sliderExtremes.max = sval;
        }
        if (sval < sliderExtremes.min) {
          sliderExtremes.min = sval;
        }
      }
    }
  }

  return {
    circlePresses,
    sliderPresses,
    circleLength,
    sliderDeltaHoldAverage,
    circleHitAverage,
    sliderLength,
    circleExtremes,
    sliderExtremes,
  };
}

export function getPresses(score: Score) {
  let frameTimes: Record<string, number> = {};
  let moddedFrameTimes: Record<string, number> = {};
  const mods = modsFromBitmask(score.info.rawMods as number);
  let normalizationRate = 1;
  if (mods.includes("DOUBLE_TIME") || mods.includes("NIGHT_CORE")) {
    normalizationRate = 1.5;
  }
  if (mods.includes("HALF_TIME")) {
    normalizationRate = 0.75;
  }

  const presses: { start: number; end: number | null; tempEnd: number }[] = [
    { start: 0, end: 0, tempEnd: 0 },
  ];

  const presses2: { start: number; end: number | null; tempEnd: number }[] = [
    { start: 0, end: 0, tempEnd: 0 },
  ];

  score.replay?.frames.forEach((_frame) => {
    let frame = _frame as LegacyReplayFrame;
    if (!frameTimes[frame.interval]) {
      frameTimes[frame.interval] = 1;
    } else {
      frameTimes[frame.interval] += 1;
    }

    if (!moddedFrameTimes[Math.round(frame.interval / normalizationRate)]) {
      moddedFrameTimes[Math.round(frame.interval / normalizationRate)] = 1;
    } else {
      moddedFrameTimes[Math.round(frame.interval / normalizationRate)] += 1;
    }

    const lastpress = presses[presses.length - 1];
    if (frame.mouseLeft) {
      if (lastpress.end !== null) {
        presses.push({
          start: frame.startTime,
          end: null,
          tempEnd: frame.startTime,
        });
      } else {
        lastpress.tempEnd = frame.startTime;
      }
    } else {
      if (lastpress.end === null) {
        lastpress.end = frame.startTime;
      }
    }

    const lastpress2 = presses2[presses2.length - 1];
    if (frame.mouseRight) {
      if (lastpress2.end !== null) {
        presses2.push({
          start: frame.startTime,
          end: null,
          tempEnd: frame.startTime,
        });
      } else {
        lastpress2.tempEnd = frame.startTime;
      }
    } else {
      if (lastpress2.end === null) {
        lastpress2.end = frame.startTime;
      }
    }
  });

  return { frameTimes, moddedFrameTimes, presses, presses2, normalizationRate };
}

export function getFormattedPresses(
  presses: {
    start: number;
    end: number | null;
    tempEnd: number;
  }[],
  presses2: {
    start: number;
    end: number | null;
    tempEnd: number;
  }[],
  map: StandardBeatmap
) {
  const allPresses = [...presses, ...presses2];

  const formattedPresses = allPresses.map((press) => ({
    start: press.start,
    end: press.end,
    duration: press.end! - press.start,
    object: null,
  }));

  let joined: any = [];
  map.hitObjects.forEach((object: any) => {
    (joined as any).push({
      start: object.startTime,
      end: null,
      sduration: (object as any).duration,
    });
  });

  formattedPresses.forEach((object) => {
    (joined as any).push({
      start: object.start,
      end: object.end,
      duration: object.duration,
    });
  });
  formattedPresses.sort((a, b) => a.start - b.start);
  joined.sort((a: any, b: any) => a.start - b.start);
  return { formattedPresses, joined };
}

export function baseRound(
  x: number,
  prec: number = 2,
  base: number = 0.05
): number {
  return Number((Math.round(x / base) * base).toFixed(prec));
}

export function gRDA(score: Score, map: StandardBeatmap) {
  const { frameTimes, moddedFrameTimes, normalizationRate, presses, presses2 } =
    getPresses(score);

  const { formattedPresses, joined } = getFormattedPresses(
    presses,
    presses2,
    map
  );

  const {
    circlePresses,
    sliderPresses,
    circleLength,
    sliderDeltaHoldAverage,
    circleHitAverage,
    sliderLength,
    circleExtremes,
    sliderExtremes,
  } = getHoldAverages(formattedPresses, map);

  const holdCircleDistributionGraph: Record<number, number> = {};

  for (const press of circlePresses) {
    const normalizedTime = baseRound(press.holdTime, 1, 3);
    if (!holdCircleDistributionGraph[normalizedTime]) {
      holdCircleDistributionGraph[normalizedTime] = 1;
    } else {
      holdCircleDistributionGraph[normalizedTime] += 1;
    }
  }

  const pressCircleDistributionGraph: Record<number, number> = {};

  for (const press of circlePresses) {
    const normalizedTime = baseRound(press.pressStart - press.start, 1, 3);
    if (!pressCircleDistributionGraph[normalizedTime]) {
      pressCircleDistributionGraph[normalizedTime] = 1;
    } else {
      pressCircleDistributionGraph[normalizedTime] += 1;
    }
  }

  return {
    frameTimes,
    moddedFrameTimes,
    normalizationRate,
    holdCircleDistributionGraph,
    pressCircleDistributionGraph,
    sliderPresses,
    circlePresses,
    sliderLength,
    circleLength,
    sliderDeltaHoldAverage,
    circleHitAverage,
    circleExtremes,
    sliderExtremes,
  };
}
