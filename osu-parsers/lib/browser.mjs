import {
  Color4,
  EventType,
  StoryboardSample,
  StoryboardAnimation,
  Vector2,
  StoryboardSprite,
  LayerType,
  StoryboardVideo,
  CompoundType,
  CommandType,
  ParameterType,
  BlendingParameters,
  Origins,
  Anchor,
  LoopType,
  BeatmapBreakEvent,
  SampleSet,
  HitObject,
  SliderPath,
  CommandLoop,
  CommandTrigger,
  HitType,
  HitSound,
  PathType,
  EffectType,
  TimeSignature,
  ControlPointType,
  ReplayButtonState,
  LegacyReplayFrame,
  Storyboard,
  SampleBank,
  PathPoint,
  HitSample,
  TimingPoint,
  DifficultyPoint,
  EffectPoint,
  SamplePoint,
  LifeBarFrame,
  Beatmap,
  ScoreInfo,
  Replay,
  Score,
} from "osu-classes";
import { decompress, compress } from "lzma-js-simple-v2";

class Parsing {
  static parseInt(input, parseLimit = this.MAX_PARSE_VALUE, allowNaN = false) {
    return this._getValue(parseInt(input), parseLimit, allowNaN);
  }
  static parseFloat(
    input,
    parseLimit = this.MAX_PARSE_VALUE,
    allowNaN = false
  ) {
    return this._getValue(parseFloat(input), parseLimit, allowNaN);
  }
  static parseEnum(enumObj, input) {
    const value = input.trim();
    const rawValue = parseInt(value);

    if (rawValue in enumObj) {
      return rawValue;
    }

    if (value in enumObj) {
      return enumObj[value];
    }

    throw new Error("Unknown enum value!");
  }
  static parseByte(input) {
    const value = parseInt(input);

    if (value < 0) {
      throw new Error("Value must be greater than 0!");
    }

    if (value > 255) {
      throw new Error("Value must be less than 255!");
    }

    return this._getValue(value);
  }
  static _getValue(value, parseLimit = this.MAX_PARSE_VALUE, allowNaN = false) {
    if (value < -parseLimit) {
      throw new Error("Value is too low!");
    }

    if (value > parseLimit) {
      throw new Error("Value is too high!");
    }

    if (!allowNaN && Number.isNaN(value)) {
      throw new Error("Not a number");
    }

    return value;
  }
}
Parsing.MAX_COORDINATE_VALUE = 131072;
Parsing.MAX_PARSE_VALUE = 2147483647;

class BeatmapColorDecoder {
  static handleLine(line, output) {
    const [key, ...values] = line.split(":");
    const rgba = values
      .join(":")
      .trim()
      .split(",")
      .map((c) => Parsing.parseByte(c));

    if (rgba.length !== 3 && rgba.length !== 4) {
      throw new Error(
        `Color specified in incorrect format (should be R,G,B or R,G,B,A): ${rgba.join(
          ","
        )}`
      );
    }

    const color = new Color4(rgba[0], rgba[1], rgba[2], rgba[3]);

    this.addColor(color, output, key.trim());
  }
  static addColor(color, output, key) {
    if (key === "SliderTrackOverride") {
      output.colors.sliderTrackColor = color;

      return;
    }

    if (key === "SliderBorder") {
      output.colors.sliderBorderColor = color;

      return;
    }

    if (key.startsWith("Combo")) {
      output.colors.comboColors.push(color);
    }
  }
}

class BeatmapDifficultyDecoder {
  static handleLine(line, beatmap) {
    const [key, ...values] = line.split(":");
    const value = values.join(":").trim();

    switch (key.trim()) {
      case "CircleSize":
        beatmap.difficulty.circleSize = Parsing.parseFloat(value);
        break;
      case "HPDrainRate":
        beatmap.difficulty.drainRate = Parsing.parseFloat(value);
        break;
      case "OverallDifficulty":
        beatmap.difficulty.overallDifficulty = Parsing.parseFloat(value);
        break;
      case "ApproachRate":
        beatmap.difficulty.approachRate = Parsing.parseFloat(value);
        break;
      case "SliderMultiplier":
        beatmap.difficulty.sliderMultiplier = Parsing.parseFloat(value);
        break;
      case "SliderTickRate":
        beatmap.difficulty.sliderTickRate = Parsing.parseFloat(value);
    }
  }
}

class BeatmapEditorDecoder {
  static handleLine(line, beatmap) {
    const [key, ...values] = line.split(":");
    const value = values.join(":").trim();

    switch (key.trim()) {
      case "Bookmarks":
        beatmap.editor.bookmarks = value.split(",").map((v) => +v);
        break;
      case "DistanceSpacing":
        beatmap.editor.distanceSpacing = Math.max(0, Parsing.parseFloat(value));
        break;
      case "BeatDivisor":
        beatmap.editor.beatDivisor = Parsing.parseInt(value);
        break;
      case "GridSize":
        beatmap.editor.gridSize = Parsing.parseInt(value);
        break;
      case "TimelineZoom":
        beatmap.editor.timelineZoom = Math.max(0, Parsing.parseFloat(value));
    }
  }
}

class StoryboardEventDecoder {
  static handleLine(line, storyboard) {
    const depth = this._getDepth(line);

    if (depth > 0) {
      line = line.substring(depth);
    }

    if (depth < 2 && this._storyboardSprite) {
      this._timelineGroup = this._storyboardSprite.timelineGroup;
    }

    switch (depth) {
      case 0:
        return this._handleElement(line, storyboard);
      case 1:
        return this._handleCompoundOrCommand(line);
      case 2:
        return this._handleCommand(line);
    }
  }
  static _handleElement(line, storyboard) {
    let _a;
    const data = line.split(",");
    const eventType = this.parseEventType(data[0]);

    if (
      (_a = this._storyboardSprite) === null || _a === void 0
        ? void 0
        : _a.hasCommands
    ) {
      this._storyboardSprite.updateCommands();
      this._storyboardSprite.adjustTimesToCommands();
      this._storyboardSprite.resetValuesToCommands();
    }

    switch (eventType) {
      case EventType.Video: {
        const layer = storyboard.getLayerByType(LayerType.Video);
        const offset = Parsing.parseInt(data[1]);
        const path = data[2].replace(/"/g, "");

        layer.elements.push(new StoryboardVideo(path, offset));

        return;
      }
      case EventType.Sprite: {
        const layer = storyboard.getLayerByType(this.parseLayerType(data[1]));
        const origin = this.parseOrigin(data[2]);
        const anchor = this.convertOrigin(origin);
        const path = data[3].replace(/"/g, "");
        const x = Parsing.parseFloat(data[4], Parsing.MAX_COORDINATE_VALUE);
        const y = Parsing.parseFloat(data[5], Parsing.MAX_COORDINATE_VALUE);

        this._storyboardSprite = new StoryboardSprite(
          path,
          origin,
          anchor,
          new Vector2(x, y)
        );
        layer.elements.push(this._storyboardSprite);

        return;
      }
      case EventType.Animation: {
        const layer = storyboard.getLayerByType(this.parseLayerType(data[1]));
        const origin = this.parseOrigin(data[2]);
        const anchor = this.convertOrigin(origin);
        const path = data[3].replace(/"/g, "");
        const x = Parsing.parseFloat(data[4], Parsing.MAX_COORDINATE_VALUE);
        const y = Parsing.parseFloat(data[5], Parsing.MAX_COORDINATE_VALUE);
        const frameCount = Parsing.parseInt(data[6]);
        let frameDelay = Parsing.parseFloat(data[7]);

        if (storyboard.fileFormat < 6) {
          frameDelay = Math.round(0.015 * frameDelay) * 1.186 * (1000 / 60);
        }

        const loopType = this.parseLoopType(data[8]);

        this._storyboardSprite = new StoryboardAnimation(
          path,
          origin,
          anchor,
          new Vector2(x, y),
          frameCount,
          frameDelay,
          loopType
        );
        layer.elements.push(this._storyboardSprite);

        return;
      }
      case EventType.Sample: {
        const time = Parsing.parseFloat(data[1]);
        const layer = storyboard.getLayerByType(this.parseLayerType(data[2]));
        const path = data[3].replace(/"/g, "");
        const volume = data.length > 4 ? Parsing.parseInt(data[4]) : 100;
        const sample = new StoryboardSample(path, time, volume);

        layer.elements.push(sample);
      }
    }
  }
  static _handleCompoundOrCommand(line) {
    let _a, _b;
    const data = line.split(",");
    const compoundType = data[0];

    switch (compoundType) {
      case CompoundType.Trigger: {
        this._timelineGroup =
          (_a = this._storyboardSprite) === null || _a === void 0
            ? void 0
            : _a.addTrigger(
                data[1],
                data.length > 2 ? Parsing.parseFloat(data[2]) : -Infinity,
                data.length > 3 ? Parsing.parseFloat(data[3]) : Infinity,
                data.length > 4 ? Parsing.parseInt(data[4]) : 0
              );

        return;
      }
      case CompoundType.Loop: {
        this._timelineGroup =
          (_b = this._storyboardSprite) === null || _b === void 0
            ? void 0
            : _b.addLoop(
                Parsing.parseFloat(data[1]),
                Math.max(0, Parsing.parseInt(data[2]) - 1)
              );

        return;
      }

      default:
        this._handleCommand(line);
    }
  }
  static _handleCommand(line) {
    let _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const data = line.split(",");
    const type = data[0];
    const easing = Parsing.parseInt(data[1]);
    const startTime = Parsing.parseInt(data[2]);
    const endTime = Parsing.parseInt(data[3] || data[2]);

    switch (type) {
      case CommandType.Fade: {
        const startValue = Parsing.parseFloat(data[4]);
        const endValue =
          data.length > 5 ? Parsing.parseFloat(data[5]) : startValue;

        (_a = this._timelineGroup) === null || _a === void 0
          ? void 0
          : _a.alpha.add(
              type,
              easing,
              startTime,
              endTime,
              startValue,
              endValue
            );

        return;
      }
      case CommandType.Scale: {
        const startValue = Parsing.parseFloat(data[4]);
        const endValue =
          data.length > 5 ? Parsing.parseFloat(data[5]) : startValue;

        (_b = this._timelineGroup) === null || _b === void 0
          ? void 0
          : _b.scale.add(
              type,
              easing,
              startTime,
              endTime,
              startValue,
              endValue
            );

        return;
      }
      case CommandType.VectorScale: {
        const startX = Parsing.parseFloat(data[4]);
        const startY = Parsing.parseFloat(data[5]);
        const endX = data.length > 6 ? Parsing.parseFloat(data[6]) : startX;
        const endY = data.length > 7 ? Parsing.parseFloat(data[7]) : startY;

        (_c = this._timelineGroup) === null || _c === void 0
          ? void 0
          : _c.vectorScale.add(
              type,
              easing,
              startTime,
              endTime,
              new Vector2(startX, startY),
              new Vector2(endX, endY)
            );

        return;
      }
      case CommandType.Rotation: {
        const startValue = Parsing.parseFloat(data[4]);
        const endValue =
          data.length > 5 ? Parsing.parseFloat(data[5]) : startValue;

        (_d = this._timelineGroup) === null || _d === void 0
          ? void 0
          : _d.rotation.add(
              type,
              easing,
              startTime,
              endTime,
              startValue,
              endValue
            );

        return;
      }
      case CommandType.Movement: {
        const startX = Parsing.parseFloat(data[4]);
        const startY = Parsing.parseFloat(data[5]);
        const endX = data.length > 6 ? Parsing.parseFloat(data[6]) : startX;
        const endY = data.length > 7 ? Parsing.parseFloat(data[7]) : startY;

        (_e = this._timelineGroup) === null || _e === void 0
          ? void 0
          : _e.x.add(
              CommandType.MovementX,
              easing,
              startTime,
              endTime,
              startX,
              endX
            );
        (_f = this._timelineGroup) === null || _f === void 0
          ? void 0
          : _f.y.add(
              CommandType.MovementY,
              easing,
              startTime,
              endTime,
              startY,
              endY
            );

        return;
      }
      case CommandType.MovementX: {
        const startValue = Parsing.parseFloat(data[4]);
        const endValue =
          data.length > 5 ? Parsing.parseFloat(data[5]) : startValue;

        (_g = this._timelineGroup) === null || _g === void 0
          ? void 0
          : _g.x.add(type, easing, startTime, endTime, startValue, endValue);

        return;
      }
      case CommandType.MovementY: {
        const startValue = Parsing.parseFloat(data[4]);
        const endValue =
          data.length > 5 ? Parsing.parseFloat(data[5]) : startValue;

        (_h = this._timelineGroup) === null || _h === void 0
          ? void 0
          : _h.y.add(type, easing, startTime, endTime, startValue, endValue);

        return;
      }
      case CommandType.Color: {
        const startRed = Parsing.parseFloat(data[4]);
        const startGreen = Parsing.parseFloat(data[5]);
        const startBlue = Parsing.parseFloat(data[6]);
        const endRed = data.length > 7 ? Parsing.parseFloat(data[7]) : startRed;
        const endGreen =
          data.length > 8 ? Parsing.parseFloat(data[8]) : startGreen;
        const endBlue =
          data.length > 9 ? Parsing.parseFloat(data[9]) : startBlue;

        (_j = this._timelineGroup) === null || _j === void 0
          ? void 0
          : _j.color.add(
              type,
              easing,
              startTime,
              endTime,
              new Color4(startRed, startGreen, startBlue, 1),
              new Color4(endRed, endGreen, endBlue, 1)
            );

        return;
      }
      case CommandType.Parameter: {
        return this._handleParameterCommand(data);
      }
    }

    throw new Error(`Unknown command type: ${type}`);
  }
  static _handleParameterCommand(data) {
    let _a, _b, _c;
    const type = CommandType.Parameter;
    const easing = Parsing.parseInt(data[1]);
    const startTime = Parsing.parseInt(data[2]);
    const endTime = Parsing.parseInt(data[3] || data[2]);
    const parameter = data[4];

    switch (parameter) {
      case ParameterType.BlendingMode: {
        const startValue = BlendingParameters.Additive;
        const endValue =
          startTime === endTime
            ? BlendingParameters.Additive
            : BlendingParameters.Inherit;

        (_a = this._timelineGroup) === null || _a === void 0
          ? void 0
          : _a.blendingParameters.add(
              type,
              easing,
              startTime,
              endTime,
              startValue,
              endValue,
              parameter
            );

        return;
      }
      case ParameterType.HorizontalFlip:
        (_b = this._timelineGroup) === null || _b === void 0
          ? void 0
          : _b.flipH.add(
              type,
              easing,
              startTime,
              endTime,
              true,
              startTime === endTime,
              parameter
            );

        return;
      case ParameterType.VerticalFlip: {
        (_c = this._timelineGroup) === null || _c === void 0
          ? void 0
          : _c.flipV.add(
              type,
              easing,
              startTime,
              endTime,
              true,
              startTime === endTime,
              parameter
            );

        return;
      }
    }

    throw new Error(`Unknown parameter type: ${parameter}`);
  }
  static parseEventType(input) {
    if (input.startsWith(" ") || input.startsWith("_")) {
      return EventType.StoryboardCommand;
    }

    try {
      return Parsing.parseEnum(EventType, input);
    } catch {
      throw new Error(`Unknown event type: ${input}`);
    }
  }
  static parseLayerType(input) {
    try {
      return Parsing.parseEnum(LayerType, input);
    } catch {
      throw new Error(`Unknown layer type: ${input}`);
    }
  }
  static parseOrigin(input) {
    try {
      return Parsing.parseEnum(Origins, input);
    } catch {
      return Origins.TopLeft;
    }
  }
  static convertOrigin(origin) {
    switch (origin) {
      case Origins.TopLeft:
        return Anchor.TopLeft;
      case Origins.TopCentre:
        return Anchor.TopCentre;
      case Origins.TopRight:
        return Anchor.TopRight;
      case Origins.CentreLeft:
        return Anchor.CentreLeft;
      case Origins.Centre:
        return Anchor.Centre;
      case Origins.CentreRight:
        return Anchor.CentreRight;
      case Origins.BottomLeft:
        return Anchor.BottomLeft;
      case Origins.BottomCentre:
        return Anchor.BottomCentre;
      case Origins.BottomRight:
        return Anchor.BottomRight;
    }

    return Anchor.TopLeft;
  }
  static parseLoopType(input) {
    try {
      return Parsing.parseEnum(LoopType, input);
    } catch {
      return LoopType.LoopForever;
    }
  }
  static _getDepth(line) {
    let depth = 0;

    for (const char of line) {
      if (char !== " " && char !== "_") {
        break;
      }

      ++depth;
    }

    return depth;
  }
}

class BeatmapEventDecoder {
  static handleLine(line, beatmap, sbLines, offset) {
    const data = line.split(",").map((v, i) => (i ? v.trim() : v));
    const eventType = StoryboardEventDecoder.parseEventType(data[0]);

    switch (eventType) {
      case EventType.Background:
        beatmap.events.backgroundPath = data[2].replace(/"/g, "");
        break;
      case EventType.Break: {
        const start = Parsing.parseFloat(data[1]) + offset;
        const end = Math.max(start, Parsing.parseFloat(data[2]) + offset);
        const breakEvent = new BeatmapBreakEvent(start, end);

        if (!beatmap.events.breaks) {
          beatmap.events.breaks = [];
        }

        beatmap.events.breaks.push(breakEvent);
        break;
      }
      case EventType.Video:
      case EventType.Sample:
      case EventType.Sprite:
      case EventType.Animation:
      case EventType.StoryboardCommand:
        if (sbLines) {
          sbLines.push(line);
        }
    }
  }
}

class BeatmapGeneralDecoder {
  static handleLine(line, beatmap, offset) {
    const [key, ...values] = line.split(":");
    const value = values.join(":").trim();

    switch (key.trim()) {
      case "AudioFilename":
        beatmap.general.audioFilename = value;
        break;
      case "AudioHash":
        beatmap.general.audioHash = value;
        break;
      case "OverlayPosition":
        beatmap.general.overlayPosition = value;
        break;
      case "SkinPreference":
        beatmap.general.skinPreference = value;
        break;
      case "AudioLeadIn":
        beatmap.general.audioLeadIn = Parsing.parseInt(value);
        break;
      case "PreviewTime":
        beatmap.general.previewTime = Parsing.parseInt(value) + offset;
        break;
      case "Countdown":
        beatmap.general.countdown = Parsing.parseInt(value);
        break;
      case "StackLeniency":
        beatmap.general.stackLeniency = Parsing.parseFloat(value);
        break;
      case "Mode":
        beatmap.originalMode = Parsing.parseInt(value);
        break;
      case "CountdownOffset":
        beatmap.general.countdownOffset = Parsing.parseInt(value);
        break;
      case "SampleSet":
        beatmap.general.sampleSet = SampleSet[value];
        break;
      case "LetterboxInBreaks":
        beatmap.general.letterboxInBreaks = value === "1";
        break;
      case "StoryFireInFront":
        beatmap.general.storyFireInFront = value === "1";
        break;
      case "UseSkinSprites":
        beatmap.general.useSkinSprites = value === "1";
        break;
      case "AlwaysShowPlayfield":
        beatmap.general.alwaysShowPlayfield = value === "1";
        break;
      case "EpilepsyWarning":
        beatmap.general.epilepsyWarning = value === "1";
        break;
      case "SpecialStyle":
        beatmap.general.specialStyle = value === "1";
        break;
      case "WidescreenStoryboard":
        beatmap.general.widescreenStoryboard = value === "1";
        break;
      case "SamplesMatchPlaybackRate":
        beatmap.general.samplesMatchPlaybackRate = value === "1";
    }
  }
}

class HittableObject extends HitObject {
  constructor() {
    super(...arguments);
    this.isNewCombo = false;
    this.comboOffset = 0;
  }
  clone() {
    const cloned = super.clone();

    cloned.isNewCombo = this.isNewCombo;
    cloned.comboOffset = this.comboOffset;

    return cloned;
  }
}

class HoldableObject extends HitObject {
  constructor() {
    super(...arguments);
    this.endTime = 0;
    this.nodeSamples = [];
  }
  get duration() {
    return this.endTime - this.startTime;
  }
  clone() {
    const cloned = super.clone();

    cloned.endTime = this.endTime;
    cloned.nestedHitObjects = this.nestedHitObjects.map((h) => h.clone());
    cloned.nodeSamples = this.nodeSamples.map((n) => n.map((s) => s.clone()));

    return cloned;
  }
}

class SlidableObject extends HitObject {
  constructor() {
    super(...arguments);
    this.repeats = 0;
    this.velocity = 1;
    this.path = new SliderPath();
    this.legacyLastTickOffset = 36;
    this.nodeSamples = [];
    this.isNewCombo = false;
    this.comboOffset = 0;
  }
  get duration() {
    return this.spans * this.spanDuration;
  }
  get endTime() {
    return this.startTime + this.duration;
  }
  get spans() {
    return this.repeats + 1;
  }
  set spans(value) {
    this.repeats = value - 1;
  }
  get spanDuration() {
    return this.distance / this.velocity;
  }
  get distance() {
    return this.path.distance;
  }
  set distance(value) {
    this.path.distance = value;
  }
  applyDefaultsToSelf(controlPoints, difficulty) {
    super.applyDefaultsToSelf(controlPoints, difficulty);

    const timingPoint = controlPoints.timingPointAt(this.startTime);
    const difficultyPoint = controlPoints.difficultyPointAt(this.startTime);
    const scoringDistance =
      SlidableObject.BASE_SCORING_DISTANCE *
      difficulty.sliderMultiplier *
      difficultyPoint.sliderVelocity;

    this.velocity = scoringDistance / timingPoint.beatLength;
  }
  clone() {
    const cloned = super.clone();

    cloned.legacyLastTickOffset = this.legacyLastTickOffset;
    cloned.nodeSamples = this.nodeSamples.map((n) => n.map((s) => s.clone()));
    cloned.velocity = this.velocity;
    cloned.repeats = this.repeats;
    cloned.path = this.path.clone();
    cloned.isNewCombo = this.isNewCombo;
    cloned.comboOffset = this.comboOffset;

    return cloned;
  }
}
SlidableObject.BASE_SCORING_DISTANCE = 100;

class SpinnableObject extends HitObject {
  constructor() {
    super(...arguments);
    this.endTime = 0;
    this.isNewCombo = false;
    this.comboOffset = 0;
  }
  get duration() {
    return this.endTime - this.startTime;
  }
  clone() {
    const cloned = super.clone();

    cloned.endTime = this.endTime;
    cloned.isNewCombo = this.isNewCombo;
    cloned.comboOffset = this.comboOffset;

    return cloned;
  }
}

let FileFormat;

(function (FileFormat) {
  FileFormat["Beatmap"] = ".osu";
  FileFormat["Storyboard"] = ".osb";
  FileFormat["Replay"] = ".osr";
})(FileFormat || (FileFormat = {}));

let LineType;

(function (LineType) {
  LineType[(LineType["FileFormat"] = 0)] = "FileFormat";
  LineType[(LineType["Section"] = 1)] = "Section";
  LineType[(LineType["Empty"] = 2)] = "Empty";
  LineType[(LineType["Data"] = 3)] = "Data";
  LineType[(LineType["Break"] = 4)] = "Break";
})(LineType || (LineType = {}));

let Section;

(function (Section) {
  Section["General"] = "General";
  Section["Editor"] = "Editor";
  Section["Metadata"] = "Metadata";
  Section["Difficulty"] = "Difficulty";
  Section["Events"] = "Events";
  Section["TimingPoints"] = "TimingPoints";
  Section["Colours"] = "Colours";
  Section["HitObjects"] = "HitObjects";
  Section["Variables"] = "Variables";
  Section["Fonts"] = "Fonts";
  Section["CatchTheBeat"] = "CatchTheBeat";
  Section["Mania"] = "Mania";
})(Section || (Section = {}));

const browserFSOperation = function () {
  throw new Error(
    "Filesystem operations are not available in a browser environment"
  );
};

class BeatmapColorEncoder {
  static encodeColors(beatmap) {
    const colors = beatmap.colors;

    if (Object.keys(colors).length === 1 && !colors.comboColors.length) {
      return "";
    }

    const encoded = ["[Colours]"];

    colors.comboColors.forEach((color, i) => {
      encoded.push(`Combo${i + 1}:${color}`);
    });

    if (colors.sliderTrackColor) {
      encoded.push(`SliderTrackOverride:${colors.sliderTrackColor}`);
    }

    if (colors.sliderBorderColor) {
      encoded.push(`SliderBorder:${colors.sliderBorderColor}`);
    }

    return encoded.join("\n");
  }
}

class BeatmapDifficultyEncoder {
  static encodeDifficultySection(beatmap) {
    const encoded = ["[Difficulty]"];
    const difficulty = beatmap.difficulty;

    encoded.push(`HPDrainRate:${difficulty.drainRate}`);
    encoded.push(`CircleSize:${difficulty.circleSize}`);
    encoded.push(`OverallDifficulty:${difficulty.overallDifficulty}`);
    encoded.push(`ApproachRate:${difficulty.approachRate}`);
    encoded.push(`SliderMultiplier:${difficulty.sliderMultiplier}`);
    encoded.push(`SliderTickRate:${difficulty.sliderTickRate}`);

    return encoded.join("\n");
  }
}

class BeatmapEditorEncoder {
  static encodeEditorSection(beatmap) {
    const encoded = ["[Editor]"];
    const editor = beatmap.editor;

    encoded.push(`Bookmarks:${editor.bookmarks.join(",")}`);
    encoded.push(`DistanceSpacing:${editor.distanceSpacing}`);
    encoded.push(`BeatDivisor:${editor.beatDivisor}`);
    encoded.push(`GridSize:${editor.gridSize}`);
    encoded.push(`TimelineZoom:${editor.timelineZoom}`);

    return encoded.join("\n");
  }
}

class StoryboardEventEncoder {
  static encodeEventSection(storyboard) {
    const encoded = [];

    encoded.push("[Events]");
    encoded.push("//Background and Video events");
    encoded.push(this.encodeVideos(storyboard));
    encoded.push(this.encodeStoryboard(storyboard));

    return encoded.join("\n");
  }
  static encodeVideos(storyboard) {
    const encoded = [];
    const video = storyboard.getLayerByType(LayerType.Video);

    if (video.elements.length > 0) {
      encoded.push(this.encodeStoryboardLayer(video));
    }

    return encoded.join("\n");
  }
  static encodeStoryboard(storyboard) {
    const encoded = [];

    encoded.push("//Storyboard Layer 0 (Background)");

    const background = storyboard.getLayerByType(LayerType.Background);

    if (background.elements.length > 0) {
      encoded.push(this.encodeStoryboardLayer(background));
    }

    encoded.push("//Storyboard Layer 1 (Fail)");

    const fail = storyboard.getLayerByType(LayerType.Fail);

    if (fail.elements.length > 0) {
      encoded.push(this.encodeStoryboardLayer(fail));
    }

    encoded.push("//Storyboard Layer 2 (Pass)");

    const pass = storyboard.getLayerByType(LayerType.Pass);

    if (pass.elements.length > 0) {
      encoded.push(this.encodeStoryboardLayer(pass));
    }

    encoded.push("//Storyboard Layer 3 (Foreground)");

    const foreground = storyboard.getLayerByType(LayerType.Foreground);

    if (foreground.elements.length > 0) {
      encoded.push(this.encodeStoryboardLayer(foreground));
    }

    encoded.push("//Storyboard Layer 4 (Overlay)");

    const overlay = storyboard.getLayerByType(LayerType.Overlay);

    if (overlay.elements.length > 0) {
      encoded.push(this.encodeStoryboardLayer(overlay));
    }

    return encoded.join("\n");
  }
  static encodeStoryboardLayer(layer) {
    const encoded = [];

    layer.elements.forEach((element) => {
      let _a, _b, _c;

      encoded.push(this.encodeStoryboardElement(element, layer.name));

      const elementWithCommands = element;

      (_a =
        elementWithCommands === null || elementWithCommands === void 0
          ? void 0
          : elementWithCommands.loops) === null || _a === void 0
        ? void 0
        : _a.forEach((loop) => {
            if (loop.commands.length > 0) {
              encoded.push(this.encodeCompound(loop));
              encoded.push(this.encodeTimelineGroup(loop, 2));
            }
          });

      if (
        ((_b =
          elementWithCommands === null || elementWithCommands === void 0
            ? void 0
            : elementWithCommands.timelineGroup) === null || _b === void 0
          ? void 0
          : _b.commands.length) > 0
      ) {
        encoded.push(
          this.encodeTimelineGroup(elementWithCommands.timelineGroup)
        );
      }

      (_c =
        elementWithCommands === null || elementWithCommands === void 0
          ? void 0
          : elementWithCommands.triggers) === null || _c === void 0
        ? void 0
        : _c.forEach((trigger) => {
            if (trigger.commands.length > 0) {
              encoded.push(this.encodeCompound(trigger));
              encoded.push(this.encodeTimelineGroup(trigger, 2));
            }
          });
    });

    return encoded.join("\n");
  }
  static encodeStoryboardElement(element, layer) {
    if (element instanceof StoryboardAnimation) {
      return [
        "Animation",
        layer,
        Origins[element.origin],
        `"${element.filePath}"`,
        element.startPosition,
        element.frameCount,
        element.frameDelay,
        element.loopType,
      ].join(",");
    }

    if (element instanceof StoryboardSprite) {
      return [
        "Sprite",
        layer,
        Origins[element.origin],
        `"${element.filePath}"`,
        element.startPosition,
      ].join(",");
    }

    if (element instanceof StoryboardSample) {
      return [
        "Sample",
        element.startTime,
        layer,
        `"${element.filePath}"`,
        element.volume,
      ].join(",");
    }

    if (element instanceof StoryboardVideo) {
      return ["Video", element.startTime, element.filePath, "0,0"].join(",");
    }

    return "";
  }
  static encodeCompound(compound, depth = 1) {
    const indentation = "".padStart(depth, " ");

    if (compound instanceof CommandLoop) {
      return (
        indentation +
        [compound.type, compound.loopStartTime, compound.totalIterations].join(
          ","
        )
      );
    }

    if (compound instanceof CommandTrigger) {
      return (
        indentation +
        [
          compound.type,
          compound.triggerName,
          compound.triggerStartTime,
          compound.triggerEndTime,
          compound.groupNumber,
        ].join(",")
      );
    }

    return "";
  }
  static encodeTimelineGroup(timelineGroup, depth = 1) {
    const indentation = "".padStart(depth, " ");
    const encoded = [];
    const commands = timelineGroup.commands;
    let shouldSkip = false;

    for (let i = 0; i < commands.length; ++i) {
      if (shouldSkip) {
        shouldSkip = false;
        continue;
      }

      if (i < commands.length - 1) {
        const current = commands[i];
        const next = commands[i + 1];
        const currentMoveX = current.type === CommandType.MovementX;
        const nextMoveY = next.type === CommandType.MovementY;
        const sameEasing = current.easing === next.easing;
        const sameStartTime = current.startTime === next.startTime;
        const sameEndTime = current.endTime === next.endTime;
        const sameCommand = sameEasing && sameStartTime && sameEndTime;

        if (currentMoveX && nextMoveY && sameCommand) {
          encoded.push(indentation + this.encodeMoveCommand(current, next));
          shouldSkip = true;
          continue;
        }
      }

      encoded.push(indentation + this.encodeCommand(commands[i]));
    }

    return encoded.join("\n");
  }
  static encodeMoveCommand(moveX, moveY) {
    const encoded = [
      CommandType.Movement,
      moveX.easing,
      moveX.startTime,
      moveX.startTime !== moveX.endTime ? moveX.endTime : "",
      moveX.startValue,
      moveY.startValue,
    ];
    const equalX = moveX.startValue === moveX.endValue;
    const equalY = moveY.startValue === moveY.endValue;

    if (!equalX || !equalY) {
      encoded.push(`${moveX.endValue},${moveY.endValue}`);
    }

    return encoded.join(",");
  }
  static encodeCommand(command) {
    const encoded = [
      command.type,
      command.easing,
      command.startTime,
      command.startTime !== command.endTime ? command.endTime : "",
      this._encodeCommandParams(command),
    ];

    return encoded.join(",");
  }
  static _encodeCommandParams(command) {
    if (command.type === CommandType.Parameter) {
      return command.parameter;
    }

    if (command.type === CommandType.Color) {
      const toRGB = (c) => `${c.red},${c.green},${c.blue}`;
      const colorCommand = command;
      const start = colorCommand.startValue;
      const end = colorCommand.endValue;

      return this._areValuesEqual(command)
        ? toRGB(start)
        : toRGB(start) + "," + toRGB(end);
    }

    return this._areValuesEqual(command)
      ? `${command.startValue}`
      : `${command.startValue},${command.endValue}`;
  }
  static _areValuesEqual(command) {
    if (command.type === CommandType.VectorScale) {
      const vectorCommand = command;

      return vectorCommand.startValue.equals(vectorCommand.endValue);
    }

    if (command.type === CommandType.Color) {
      const colorCommand = command;

      return colorCommand.startValue.equals(colorCommand.endValue);
    }

    return command.startValue === command.endValue;
  }
}

class BeatmapEventEncoder {
  static encodeEventSection(beatmap) {
    const encoded = [];
    const events = beatmap.events;

    encoded.push("[Events]");
    encoded.push("//Background and Video events");

    if (events.backgroundPath) {
      encoded.push(`0,0,"${events.backgroundPath}",0,0`);
    }

    if (events.storyboard) {
      encoded.push(StoryboardEventEncoder.encodeVideos(events.storyboard));
    }

    encoded.push("//Break Periods");

    if (events.breaks && events.breaks.length > 0) {
      events.breaks.forEach((b) => {
        encoded.push(
          `${EventType[EventType.Break]},${b.startTime},${b.endTime}`
        );
      });
    }

    if (events.storyboard) {
      encoded.push(StoryboardEventEncoder.encodeStoryboard(events.storyboard));
    }

    return encoded.join("\n");
  }
}

class BeatmapGeneralEncoder {
  static encodeGeneralSection(beatmap) {
    const encoded = ["[General]"];
    const general = beatmap.general;

    encoded.push(`AudioFilename:${general.audioFilename}`);
    encoded.push(`AudioLeadIn:${general.audioLeadIn}`);

    if (general.audioHash) {
      encoded.push(`AudioHash:${general.audioHash}`);
    }

    encoded.push(`PreviewTime:${general.previewTime}`);
    encoded.push(`Countdown:${general.countdown}`);
    encoded.push(`SampleSet:${SampleSet[general.sampleSet]}`);
    encoded.push(`StackLeniency:${general.stackLeniency}`);
    encoded.push(`Mode:${beatmap.mode}`);
    encoded.push(`LetterboxInBreaks:${+general.letterboxInBreaks}`);

    if (general.storyFireInFront) {
      encoded.push(`StoryFireInFront:${+general.storyFireInFront}`);
    }

    encoded.push(`UseSkinSprites:${+general.useSkinSprites}`);

    if (general.alwaysShowPlayfield) {
      encoded.push(`AlwaysShowPlayfield:${+general.alwaysShowPlayfield}`);
    }

    encoded.push(`OverlayPosition:${general.overlayPosition}`);
    encoded.push(`SkinPreference:${general.skinPreference}`);
    encoded.push(`EpilepsyWarning:${+general.epilepsyWarning}`);
    encoded.push(`CountdownOffset:${general.countdownOffset}`);
    encoded.push(`SpecialStyle:${+general.specialStyle}`);
    encoded.push(`WidescreenStoryboard:${+general.widescreenStoryboard}`);
    encoded.push(
      `SamplesMatchPlaybackRate:${+general.samplesMatchPlaybackRate}`
    );

    return encoded.join("\n");
  }
}

class BeatmapHitObjectEncoder {
  static encodeHitObjects(beatmap) {
    const encoded = ["[HitObjects]"];
    const difficulty = beatmap.difficulty;
    const hitObjects = beatmap.hitObjects;

    hitObjects.forEach((hitObject) => {
      const general = [];
      const position = hitObject.startPosition;
      const startPosition = new Vector2(
        position ? position.x : 256,
        position ? position.y : 192
      );

      if (beatmap.mode === 3) {
        const totalColumns = Math.trunc(Math.max(1, difficulty.circleSize));
        const multiplier = Math.round((512 / totalColumns) * 100000) / 100000;
        const column = hitObject.startX;

        startPosition.x =
          Math.ceil(column * multiplier) + Math.trunc(multiplier / 2);
      }

      general.push(startPosition.toString());
      general.push(hitObject.startTime.toString());
      general.push(hitObject.hitType.toString());
      general.push(hitObject.hitSound.toString());

      const extras = [];

      if (hitObject.hitType & HitType.Slider) {
        const slider = hitObject;

        extras.push(this.encodePathData(slider, startPosition));
      } else if (hitObject.hitType & HitType.Spinner) {
        const spinner = hitObject;

        extras.push(this.encodeEndTimeData(spinner));
      } else if (hitObject.hitType & HitType.Hold) {
        const hold = hitObject;

        extras.push(this.encodeEndTimeData(hold));
      }

      const set = [];
      const normal = hitObject.samples.find(
        (s) => s.hitSound === HitSound[HitSound.Normal]
      );
      const addition = hitObject.samples.find(
        (s) => s.hitSound !== HitSound[HitSound.Normal]
      );
      let normalSet = SampleSet.None;
      let additionSet = SampleSet.None;

      if (normal) {
        normalSet = SampleSet[normal.sampleSet];
      }

      if (addition) {
        additionSet = SampleSet[addition.sampleSet];
      }

      set[0] = normalSet.toString();
      set[1] = additionSet.toString();
      set[2] = hitObject.samples[0].customIndex.toString();
      set[3] = hitObject.samples[0].volume.toString();
      set[4] = hitObject.samples[0].filename;
      extras.push(set.join(":"));

      const generalLine = general.join(",");
      const extrasLine =
        hitObject.hitType & HitType.Hold ? extras.join(":") : extras.join(",");

      encoded.push([generalLine, extrasLine].join(","));
    });

    return encoded.join("\n");
  }
  static encodePathData(slider, offset) {
    const path = [];
    let lastType;

    slider.path.controlPoints.forEach((point, i) => {
      if (point.type !== null) {
        let needsExplicitSegment =
          point.type !== lastType || point.type === PathType.PerfectCurve;

        if (i > 1) {
          const p1 = offset.add(slider.path.controlPoints[i - 1].position);
          const p2 = offset.add(slider.path.controlPoints[i - 2].position);

          if (~~p1.x === ~~p2.x && ~~p1.y === ~~p2.y) {
            needsExplicitSegment = true;
          }
        }

        if (needsExplicitSegment) {
          path.push(slider.path.curveType);
          lastType = point.type;
        } else {
          path.push(
            `${offset.x + point.position.x}:${offset.y + point.position.y}`
          );
        }
      }

      if (i !== 0) {
        path.push(
          `${offset.x + point.position.x}:${offset.y + point.position.y}`
        );
      }
    });

    const data = [];

    data.push(path.join("|"));
    data.push((slider.repeats + 1).toString());
    data.push(slider.distance.toString());

    const adds = [];
    const sets = [];

    slider.nodeSamples.forEach((node, nodeIndex) => {
      adds[nodeIndex] = HitSound.None;
      sets[nodeIndex] = [SampleSet.None, SampleSet.None];
      node.forEach((sample, sampleIndex) => {
        if (sampleIndex === 0) {
          sets[nodeIndex][0] = SampleSet[sample.sampleSet];
        } else {
          adds[nodeIndex] |= HitSound[sample.hitSound];
          sets[nodeIndex][1] = SampleSet[sample.sampleSet];
        }
      });
    });

    data.push(adds.join("|"));
    data.push(sets.map((set) => set.join(":")).join("|"));

    return data.join(",");
  }
  static encodeEndTimeData(hitObject) {
    return hitObject.endTime.toString();
  }
}

class BeatmapMetadataEncoder {
  static encodeMetadataSection(beatmap) {
    const encoded = ["[Metadata]"];
    const metadata = beatmap.metadata;

    encoded.push(`Title:${metadata.title}`);
    encoded.push(`TitleUnicode:${metadata.titleUnicode}`);
    encoded.push(`Artist:${metadata.artist}`);
    encoded.push(`ArtistUnicode:${metadata.artistUnicode}`);
    encoded.push(`Creator:${metadata.creator}`);
    encoded.push(`Version:${metadata.version}`);
    encoded.push(`Source:${metadata.source}`);
    encoded.push(`Tags:${metadata.tags.join(" ")}`);
    encoded.push(`BeatmapID:${metadata.beatmapId}`);
    encoded.push(`BeatmapSetID:${metadata.beatmapSetId}`);

    return encoded.join("\n");
  }
}

class BeatmapTimingPointEncoder {
  static encodeControlPoints(beatmap) {
    const encoded = ["[TimingPoints]"];

    beatmap.controlPoints.groups.forEach((group) => {
      const points = group.controlPoints;
      const timing = points.find((c) => c.beatLength);

      if (timing) {
        encoded.push(this.encodeGroup(group, true));
      }

      encoded.push(this.encodeGroup(group));
    });

    return encoded.join("\n");
  }
  static encodeGroup(group, useTiming = false) {
    const { difficultyPoint, effectPoint, samplePoint, timingPoint } =
      this.updateActualPoints(group);
    const startTime = group.startTime;
    let beatLength = -100;

    if (difficultyPoint !== null) {
      beatLength /= difficultyPoint.sliderVelocity;
    }

    let sampleSet = SampleSet.None;
    let customIndex = 0;
    let volume = 100;

    if (samplePoint !== null) {
      sampleSet = SampleSet[samplePoint.sampleSet];
      customIndex = samplePoint.customIndex;
      volume = samplePoint.volume;
    }

    let effects = EffectType.None;

    if (effectPoint !== null) {
      const kiai = effectPoint.kiai ? EffectType.Kiai : EffectType.None;
      const omitFirstBarLine = effectPoint.omitFirstBarLine
        ? EffectType.OmitFirstBarLine
        : EffectType.None;

      effects |= kiai | omitFirstBarLine;
    }

    let timeSignature = TimeSignature.SimpleQuadruple;
    let uninherited = 0;

    if (useTiming && timingPoint !== null) {
      beatLength = timingPoint.beatLength;
      timeSignature = timingPoint.timeSignature;
      uninherited = 1;
    }

    return [
      startTime,
      beatLength,
      timeSignature,
      sampleSet,
      customIndex,
      volume,
      uninherited,
      effects,
    ].join(",");
  }
  static updateActualPoints(group) {
    let timingPoint = null;

    group.controlPoints.forEach((point) => {
      if (
        point.pointType === ControlPointType.DifficultyPoint &&
        !point.isRedundant(this.lastDifficultyPoint)
      ) {
        this.lastDifficultyPoint = point;
      }

      if (
        point.pointType === ControlPointType.EffectPoint &&
        !point.isRedundant(this.lastEffectPoint)
      ) {
        this.lastEffectPoint = point;
      }

      if (
        point.pointType === ControlPointType.SamplePoint &&
        !point.isRedundant(this.lastSamplePoint)
      ) {
        this.lastSamplePoint = point;
      }

      if (point.pointType === ControlPointType.TimingPoint) {
        timingPoint = point;
      }
    });

    return {
      timingPoint,
      difficultyPoint: this.lastDifficultyPoint,
      effectPoint: this.lastEffectPoint,
      samplePoint: this.lastSamplePoint,
    };
  }
}
BeatmapTimingPointEncoder.lastDifficultyPoint = null;
BeatmapTimingPointEncoder.lastEffectPoint = null;
BeatmapTimingPointEncoder.lastSamplePoint = null;

class ReplayEncoder {
  static encodeLifeBar(frames) {
    if (!frames.length) {
      return "";
    }

    return frames.map((f) => `${f.startTime}|${f.health}`).join(",");
  }
  static encodeReplayFrames(frames, beatmap) {
    const encoded = [];

    if (frames) {
      let lastTime = 0;

      frames.forEach((frame) => {
        let _a, _b, _c;
        const time = Math.round(frame.startTime);
        const legacyFrame = this._getLegacyFrame(frame, beatmap);
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
    }

    encoded.push("-12345|0|0|0");

    return encoded.join(",");
  }
  static _getLegacyFrame(frame, beatmap) {
    if (frame instanceof LegacyReplayFrame) {
      return frame;
    }

    const convertibleFrame = frame;

    if (convertibleFrame.toLegacy) {
      return convertibleFrame.toLegacy(beatmap);
    }

    throw new Error(
      "Some of the replay frames can not be converted to the legacy format!"
    );
  }
}

const textDecoder = new TextDecoder();

function concatBufferViews(list) {
  if (list.length <= 0) {
    return new Uint8Array(0);
  }

  const bufferLength = list.reduce((len, buf) => len + buf.byteLength, 0);
  const arrayBuffer = new Uint8Array(bufferLength);

  list.reduce((offset, view) => {
    arrayBuffer.set(new Uint8Array(view.buffer), offset);

    return offset + view.byteLength;
  }, 0);

  return arrayBuffer;
}

function stringifyBuffer(data) {
  if (typeof data === "string") {
    return data;
  }

  return textDecoder.decode(data);
}

class SerializationWriter {
  constructor() {
    this._bytesWritten = 0;
    this._views = [];
  }
  get bytesWritten() {
    return this._bytesWritten;
  }
  finish() {
    return concatBufferViews(this._views);
  }
  writeByte(value) {
    return this._update(1, new Uint8Array([value]));
  }
  writeBytes(value) {
    this._bytesWritten += value.byteLength;
    this._views.push(value);

    return value.byteLength;
  }
  writeShort(value) {
    return this._update(2, new Uint16Array([value]));
  }
  writeInteger(value) {
    return this._update(4, new Int32Array([value]));
  }
  writeLong(value) {
    return this._update(8, new BigInt64Array([value]));
  }
  writeDate(date) {
    const epochTicks = BigInt(62135596800000);
    const ticks = BigInt(date.getTime());

    return this.writeLong((ticks + epochTicks) * BigInt(1e4));
  }
  writeString(value) {
    if (value.length === 0) {
      return this.writeByte(0x00);
    }

    let bytesWritten = this.writeByte(0x0b);

    bytesWritten += this.writeULEB128(value.length);

    const view = new Uint8Array(value.length);

    for (let i = 0; i < value.length; ++i) {
      view[i] = value.charCodeAt(i);
      bytesWritten++;
    }

    this._update(bytesWritten, view);

    return bytesWritten;
  }
  writeULEB128(value) {
    let byte = 0;
    let bytesWritten = 0;

    do {
      byte = value & 0x7f;
      value >>= 7;

      if (value !== 0) {
        byte |= 0x80;
      }

      bytesWritten += this.writeByte(byte);
    } while (value !== 0);

    return bytesWritten;
  }
  _update(bytesWritten, buffer) {
    this._bytesWritten += bytesWritten;
    this._views.push(buffer);

    return bytesWritten;
  }
}

class BeatmapEncoder {
  async encodeToPath(path, beatmap) {
    if (!path.endsWith(FileFormat.Beatmap)) {
      path += FileFormat.Beatmap;
    }

    try {
      await browserFSOperation(browserFSOperation(path), { recursive: true });
      await browserFSOperation(path, await this.encodeToString(beatmap));
    } catch (err) {
      const reason = err.message || err;
      throw new Error(`Failed to encode a beatmap: ${reason}`);
    }
  }
  encodeToString(beatmap) {
    let _a;

    if (
      !(beatmap === null || beatmap === void 0 ? void 0 : beatmap.fileFormat)
    ) {
      return "";
    }

    const fileFormat =
      (_a = beatmap.fileFormat) !== null && _a !== void 0
        ? _a
        : BeatmapEncoder.FIRST_LAZER_VERSION;
    const encoded = [
      `osu file format v${fileFormat}`,
      BeatmapGeneralEncoder.encodeGeneralSection(beatmap),
      BeatmapEditorEncoder.encodeEditorSection(beatmap),
      BeatmapMetadataEncoder.encodeMetadataSection(beatmap),
      BeatmapDifficultyEncoder.encodeDifficultySection(beatmap),
      BeatmapEventEncoder.encodeEventSection(beatmap),
      BeatmapTimingPointEncoder.encodeControlPoints(beatmap),
      BeatmapColorEncoder.encodeColors(beatmap),
      BeatmapHitObjectEncoder.encodeHitObjects(beatmap),
    ];

    return encoded.join("\n\n") + "\n";
  }
}
BeatmapEncoder.FIRST_LAZER_VERSION = 128;

class StoryboardEncoder {
  async encodeToPath(path, storyboard) {
    if (!path.endsWith(FileFormat.Storyboard)) {
      path += FileFormat.Storyboard;
    }

    try {
      await browserFSOperation(browserFSOperation(path), { recursive: true });
      await browserFSOperation(path, await this.encodeToString(storyboard));
    } catch (err) {
      const reason = err.message || err;
      throw new Error(`Failed to encode a storyboard: ${reason}`);
    }
  }
  encodeToString(storyboard) {
    if (!(storyboard instanceof Storyboard)) {
      return "";
    }

    const encoded = [
      `osu file format v${storyboard.fileFormat}`,
      StoryboardEventEncoder.encodeEventSection(storyboard),
    ];

    return encoded.join("\n\n") + "\n";
  }
}

class LZMA {
  static async decompress(data) {
    try {
      return await this._lzma.decompress(data);
    } catch {
      return "";
    }
  }
  static async compress(data) {
    try {
      return await this._lzma.compress(data, 1);
    } catch {
      return new Uint8Array([]);
    }
  }
}
LZMA._lzma = getLZMAInstance();

function getLZMAInstance() {
  return {
    decompress(data) {
      return new Promise((res, rej) => {
        decompress(data, (result, err) => {
          err
            ? rej(err)
            : res(
                typeof result === "string"
                  ? result
                  : new Uint8Array(result).toString()
              );
        });
      });
    },
    compress(data) {
      return new Promise((res, rej) => {
        compress(data, 1, (result, err) => {
          err ? rej(err) : res(new Uint8Array(result));
        });
      });
    },
  };
}

class ScoreEncoder {
  async encodeToPath(path, score, beatmap) {
    if (!path.endsWith(FileFormat.Replay)) {
      path += FileFormat.Replay;
    }

    const data = await this.encodeToBuffer(score, beatmap);

    try {
      await browserFSOperation(browserFSOperation(path), { recursive: true });
      await browserFSOperation(path, new Uint8Array(data));
    } catch (err) {
      const reason = err.message || err;
      throw new Error(`Failed to encode a score: ${reason}`);
    }
  }
  async encodeToBuffer(score, beatmap) {
    let _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;

    if (
      typeof ((_a =
        score === null || score === void 0 ? void 0 : score.info) === null ||
      _a === void 0
        ? void 0
        : _a.id) !== "number"
    ) {
      return new Uint8Array();
    }

    const writer = new SerializationWriter();

    try {
      writer.writeByte(score.info.rulesetId);
      writer.writeInteger(
        (_c =
          (_b = score.replay) === null || _b === void 0
            ? void 0
            : _b.gameVersion) !== null && _c !== void 0
          ? _c
          : ScoreEncoder.DEFAULT_GAME_VERSION
      );
      writer.writeString(
        (_d = score.info.beatmapHashMD5) !== null && _d !== void 0 ? _d : ""
      );
      writer.writeString(score.info.username);
      writer.writeString(
        (_f =
          (_e = score.replay) === null || _e === void 0
            ? void 0
            : _e.hashMD5) !== null && _f !== void 0
          ? _f
          : ""
      );
      writer.writeShort(score.info.count300);
      writer.writeShort(score.info.count100);
      writer.writeShort(score.info.count50);
      writer.writeShort(score.info.countGeki);
      writer.writeShort(score.info.countKatu);
      writer.writeShort(score.info.countMiss);
      writer.writeInteger(score.info.totalScore);
      writer.writeShort(score.info.maxCombo);
      writer.writeByte(Number(score.info.perfect));
      writer.writeInteger(
        ((_h =
          (_g = score.info.mods) === null || _g === void 0
            ? void 0
            : _g.bitwise) !== null && _h !== void 0
          ? _h
          : Number(score.info.rawMods)) || 0
      );
      writer.writeString(
        ReplayEncoder.encodeLifeBar(
          (_k =
            (_j = score.replay) === null || _j === void 0
              ? void 0
              : _j.lifeBar) !== null && _k !== void 0
            ? _k
            : []
        )
      );
      writer.writeDate(score.info.date);

      if (score.replay) {
        const replayData = ReplayEncoder.encodeReplayFrames(
          score.replay.frames,
          beatmap
        );
        const encodedData = await LZMA.compress(replayData);

        writer.writeInteger(encodedData.byteLength);
        writer.writeBytes(encodedData);
      } else {
        writer.writeInteger(0);
      }

      writer.writeLong(BigInt(score.info.id));

      return writer.finish();
    } catch (err) {
      const reason = err.message || err;
      throw new Error(`Failed to encode a score: '${reason}'`);
    }
  }
}
ScoreEncoder.DEFAULT_GAME_VERSION = 20230621;

class BeatmapHitObjectDecoder {
  static handleLine(line, beatmap, offset) {
    const data = line.split(",").map((v) => v.trim());
    const hitType = Parsing.parseInt(data[3]);
    const hitObject = this.createHitObject(hitType);

    hitObject.startX = Parsing.parseInt(data[0], Parsing.MAX_COORDINATE_VALUE);
    hitObject.startY = Parsing.parseInt(data[1], Parsing.MAX_COORDINATE_VALUE);
    hitObject.startTime = Parsing.parseFloat(data[2]) + offset;
    hitObject.hitType = hitType;
    hitObject.hitSound = Parsing.parseInt(data[4]);

    const bankInfo = new SampleBank();

    this.addExtras(
      data.slice(5),
      hitObject,
      bankInfo,
      offset,
      beatmap.fileFormat
    );
    this.addComboOffset(hitObject, beatmap);

    if (hitObject.samples.length === 0) {
      hitObject.samples = this.convertSoundType(hitObject.hitSound, bankInfo);
    }

    beatmap.hitObjects.push(hitObject);
  }
  static addComboOffset(hitObject, beatmap) {
    const isStandard = beatmap.originalMode === 0;
    const isCatch = beatmap.originalMode === 2;

    if (!isStandard && !isCatch) {
      return;
    }

    const comboObject = hitObject;
    const comboOffset = Math.trunc(
      (hitObject.hitType & HitType.ComboOffset) >> 4
    );
    const newCombo = !!(hitObject.hitType & HitType.NewCombo);

    if (
      hitObject.hitType & HitType.Normal ||
      hitObject.hitType & HitType.Slider
    ) {
      comboObject.isNewCombo = newCombo || this._forceNewCombo;
      comboObject.comboOffset = comboOffset + this._extraComboOffset;
      this._forceNewCombo = false;
      this._extraComboOffset = 0;
    }

    if (hitObject.hitType & HitType.Spinner) {
      this._forceNewCombo = beatmap.fileFormat <= 8 || newCombo || false;
      this._extraComboOffset += comboOffset;
    }
  }
  static addExtras(data, hitObject, bankInfo, offset, fileFormat) {
    if (hitObject.hitType & HitType.Normal && data.length > 0) {
      this.readCustomSampleBanks(data[0], bankInfo);
    }

    if (hitObject.hitType & HitType.Slider) {
      return this.addSliderExtras(data, hitObject, bankInfo, fileFormat);
    }

    if (hitObject.hitType & HitType.Spinner) {
      return this.addSpinnerExtras(data, hitObject, bankInfo, offset);
    }

    if (hitObject.hitType & HitType.Hold) {
      return this.addHoldExtras(data, hitObject, bankInfo, offset);
    }
  }
  static addSliderExtras(extras, slider, bankInfo, fileFormat) {
    const pathString = extras[0];
    const offset = slider.startPosition;
    const repeats = Parsing.parseInt(extras[1]);

    if (slider.repeats > 9000) {
      throw new Error("Repeat count is way too high");
    }

    slider.repeats = Math.max(0, repeats - 1);
    slider.path.controlPoints = this.convertPathString(
      pathString,
      offset,
      fileFormat
    );
    slider.path.curveType = slider.path.controlPoints[0].type;

    if (extras.length > 2) {
      const length = Parsing.parseFloat(
        extras[2],
        Parsing.MAX_COORDINATE_VALUE
      );

      slider.path.expectedDistance = Math.max(0, length);
    }

    if (extras.length > 5) {
      this.readCustomSampleBanks(extras[5], bankInfo);
    }

    slider.samples = this.convertSoundType(slider.hitSound, bankInfo);
    slider.nodeSamples = this.getSliderNodeSamples(extras, slider, bankInfo);
  }
  static addSpinnerExtras(extras, spinner, bankInfo, offset) {
    spinner.endTime = Parsing.parseInt(extras[0]) + offset;

    if (extras.length > 1) {
      this.readCustomSampleBanks(extras[1], bankInfo);
    }
  }
  static addHoldExtras(extras, hold, bankInfo, offset) {
    hold.endTime = hold.startTime;

    if (extras.length > 0 && extras[0]) {
      const ss = extras[0].split(":");

      hold.endTime = Math.max(hold.endTime, Parsing.parseFloat(ss[0])) + offset;
      this.readCustomSampleBanks(ss.slice(1).join(":"), bankInfo);
    }
  }
  static getSliderNodeSamples(extras, slider, bankInfo) {
    const nodes = slider.repeats + 2;
    const nodeBankInfos = [];

    for (let i = 0; i < nodes; ++i) {
      nodeBankInfos.push(bankInfo.clone());
    }

    if (extras.length > 4 && extras[4].length > 0) {
      const sets = extras[4].split("|");

      for (let i = 0; i < nodes; ++i) {
        if (i >= sets.length) {
          break;
        }

        this.readCustomSampleBanks(sets[i], nodeBankInfos[i]);
      }
    }

    const nodeSoundTypes = [];

    for (let i = 0; i < nodes; ++i) {
      nodeSoundTypes.push(slider.hitSound);
    }

    if (extras.length > 3 && extras[3].length > 0) {
      const adds = extras[3].split("|");

      for (let i = 0; i < nodes; ++i) {
        if (i >= adds.length) {
          break;
        }

        nodeSoundTypes[i] = parseInt(adds[i]) || HitSound.None;
      }
    }

    const nodeSamples = [];

    for (let i = 0; i < nodes; i++) {
      nodeSamples.push(
        this.convertSoundType(nodeSoundTypes[i], nodeBankInfos[i])
      );
    }

    return nodeSamples;
  }
  static convertPathString(pathString, offset, fileFormat) {
    const pathSplit = pathString.split("|").map((p) => p.trim());
    const controlPoints = [];
    let startIndex = 0;
    let endIndex = 0;
    let isFirst = true;

    while (++endIndex < pathSplit.length) {
      if (pathSplit[endIndex].length > 1) {
        continue;
      }

      const points = pathSplit.slice(startIndex, endIndex);
      const endPoint =
        endIndex < pathSplit.length - 1 ? pathSplit[endIndex + 1] : null;
      const convertedPoints = this.convertPoints(
        points,
        endPoint,
        isFirst,
        offset,
        fileFormat
      );

      for (const point of convertedPoints) {
        controlPoints.push(...point);
      }

      startIndex = endIndex;
      isFirst = false;
    }

    if (endIndex > startIndex) {
      const points = pathSplit.slice(startIndex, endIndex);
      const convertedPoints = this.convertPoints(
        points,
        null,
        isFirst,
        offset,
        fileFormat
      );

      for (const point of convertedPoints) {
        controlPoints.push(...point);
      }
    }

    return controlPoints;
  }
  static *convertPoints(points, endPoint, isFirst, offset, fileFormat) {
    const readOffset = isFirst ? 1 : 0;
    const endPointLength = endPoint !== null ? 1 : 0;
    const vertices = [];

    if (readOffset === 1) {
      vertices[0] = new PathPoint();
    }

    for (let i = 1; i < points.length; ++i) {
      vertices[readOffset + i - 1] = readPoint(points[i], offset);
    }

    if (endPoint !== null) {
      vertices[vertices.length - 1] = readPoint(endPoint, offset);
    }

    let type = this.convertPathType(points[0]);

    if (type === PathType.PerfectCurve) {
      if (vertices.length !== 3) {
        type = PathType.Bezier;
      } else if (isLinear(vertices)) {
        type = PathType.Linear;
      }
    }

    vertices[0].type = type;

    let startIndex = 0;
    let endIndex = 0;

    while (++endIndex < vertices.length - endPointLength) {
      if (
        !vertices[endIndex].position.equals(vertices[endIndex - 1].position)
      ) {
        continue;
      }

      const isStableBeatmap = fileFormat < BeatmapEncoder.FIRST_LAZER_VERSION;

      if (type === PathType.Catmull && endIndex > 1 && isStableBeatmap) {
        continue;
      }

      if (endIndex === vertices.length - endPointLength - 1) {
        continue;
      }

      vertices[endIndex - 1].type = type;
      yield vertices.slice(startIndex, endIndex);
      startIndex = endIndex + 1;
    }

    if (endIndex > startIndex) {
      yield vertices.slice(startIndex, endIndex);
    }

    function readPoint(point, offset) {
      const coords = point.split(":").map((v) => {
        return Math.trunc(Parsing.parseFloat(v, Parsing.MAX_COORDINATE_VALUE));
      });
      const pos = new Vector2(coords[0], coords[1]).fsubtract(offset);

      return new PathPoint(pos);
    }

    function isLinear(p) {
      const yx =
        (p[1].position.y - p[0].position.y) *
        (p[2].position.x - p[0].position.x);
      const xy =
        (p[1].position.x - p[0].position.x) *
        (p[2].position.y - p[0].position.y);
      const acceptableDifference = 0.001;

      return Math.abs(yx - xy) < acceptableDifference;
    }
  }
  static convertPathType(type) {
    switch (type) {
      default:
      case "C":
        return PathType.Catmull;
      case "B":
        return PathType.Bezier;
      case "L":
        return PathType.Linear;
      case "P":
        return PathType.PerfectCurve;
    }
  }
  static readCustomSampleBanks(hitSample, bankInfo) {
    if (!hitSample) {
      return;
    }

    const split = hitSample.split(":");

    bankInfo.normalSet = Parsing.parseInt(split[0]);
    bankInfo.additionSet = Parsing.parseInt(split[1]);

    if (bankInfo.additionSet === SampleSet.None) {
      bankInfo.additionSet = bankInfo.normalSet;
    }

    if (split.length > 2) {
      bankInfo.customIndex = Parsing.parseInt(split[2]);
    }

    if (split.length > 3) {
      bankInfo.volume = Math.max(0, Parsing.parseInt(split[3]));
    }

    bankInfo.filename = split.length > 4 ? split[4] : "";
  }
  static convertSoundType(type, bankInfo) {
    if (bankInfo.filename) {
      const sample = new HitSample();

      sample.filename = bankInfo.filename;
      sample.volume = bankInfo.volume;

      return [sample];
    }

    const soundTypes = [new HitSample()];

    soundTypes[0].hitSound = HitSound[HitSound.Normal];
    soundTypes[0].sampleSet = SampleSet[bankInfo.normalSet];
    soundTypes[0].isLayered =
      type !== HitSound.None && !(type & HitSound.Normal);

    if (type & HitSound.Finish) {
      const sample = new HitSample();

      sample.hitSound = HitSound[HitSound.Finish];
      soundTypes.push(sample);
    }

    if (type & HitSound.Whistle) {
      const sample = new HitSample();

      sample.hitSound = HitSound[HitSound.Whistle];
      soundTypes.push(sample);
    }

    if (type & HitSound.Clap) {
      const sample = new HitSample();

      sample.hitSound = HitSound[HitSound.Clap];
      soundTypes.push(sample);
    }

    soundTypes.forEach((sound, i) => {
      sound.sampleSet =
        i !== 0
          ? SampleSet[bankInfo.additionSet]
          : SampleSet[bankInfo.normalSet];

      sound.volume = bankInfo.volume;
      sound.customIndex = 0;

      if (bankInfo.customIndex >= 2) {
        sound.customIndex = bankInfo.customIndex;
      }
    });

    return soundTypes;
  }
  static createHitObject(hitType) {
    if (hitType & HitType.Normal) {
      return new HittableObject();
    }

    if (hitType & HitType.Slider) {
      return new SlidableObject();
    }

    if (hitType & HitType.Spinner) {
      return new SpinnableObject();
    }

    if (hitType & HitType.Hold) {
      return new HoldableObject();
    }

    throw new Error(`Unknown hit object type: ${hitType}!`);
  }
}
BeatmapHitObjectDecoder._forceNewCombo = false;
BeatmapHitObjectDecoder._extraComboOffset = 0;

class BeatmapMetadataDecoder {
  static handleLine(line, beatmap) {
    const [key, ...values] = line.split(":");
    const value = values.join(":").trim();

    switch (key.trim()) {
      case "Title":
        beatmap.metadata.title = value;
        break;
      case "TitleUnicode":
        beatmap.metadata.titleUnicode = value;
        break;
      case "Artist":
        beatmap.metadata.artist = value;
        break;
      case "ArtistUnicode":
        beatmap.metadata.artistUnicode = value;
        break;
      case "Creator":
        beatmap.metadata.creator = value;
        break;
      case "Version":
        beatmap.metadata.version = value;
        break;
      case "Source":
        beatmap.metadata.source = value;
        break;
      case "Tags":
        beatmap.metadata.tags = value.split(" ");
        break;
      case "BeatmapID":
        beatmap.metadata.beatmapId = Parsing.parseInt(value);
        break;
      case "BeatmapSetID":
        beatmap.metadata.beatmapSetId = Parsing.parseInt(value);
    }
  }
}

class BeatmapTimingPointDecoder {
  static handleLine(line, beatmap, offset) {
    this.controlPoints = beatmap.controlPoints;

    const data = line.split(",");
    let timeSignature = TimeSignature.SimpleQuadruple;
    let sampleSet = SampleSet[SampleSet.None];
    let customIndex = 0;
    let volume = 100;
    let timingChange = true;
    let effects = EffectType.None;

    if (data.length > 2) {
      switch (data.length) {
        default:
        case 8:
          effects = Parsing.parseInt(data[7]);
        case 7:
          timingChange = data[6] === "1";
        case 6:
          volume = Parsing.parseInt(data[5]);
        case 5:
          customIndex = Parsing.parseInt(data[4]);
        case 4:
          sampleSet = SampleSet[Parsing.parseInt(data[3])];
        case 3:
          timeSignature = Parsing.parseInt(data[2]);
      }
    }

    if (timeSignature < 1) {
      throw new Error("The numerator of a time signature must be positive.");
    }

    const startTime = Parsing.parseFloat(data[0]) + offset;
    const beatLength = Parsing.parseFloat(
      data[1],
      Parsing.MAX_PARSE_VALUE,
      true
    );
    let bpmMultiplier = 1;
    let speedMultiplier = 1;

    if (beatLength < 0) {
      speedMultiplier = 100 / -beatLength;
      bpmMultiplier = Math.min(Math.fround(-beatLength), 10000);
      bpmMultiplier = Math.max(10, bpmMultiplier) / 100;
    }

    if (timingChange && Number.isNaN(beatLength)) {
      throw new Error("Beat length cannot be NaN in a timing control point");
    }

    if (timingChange) {
      const timingPoint = new TimingPoint();

      timingPoint.beatLength = beatLength;
      timingPoint.timeSignature = timeSignature;
      this.addControlPoint(timingPoint, startTime, true);
    }

    const difficultyPoint = new DifficultyPoint();

    difficultyPoint.bpmMultiplier = bpmMultiplier;
    difficultyPoint.sliderVelocity = speedMultiplier;
    difficultyPoint.generateTicks = !Number.isNaN(beatLength);
    difficultyPoint.isLegacy = true;
    this.addControlPoint(difficultyPoint, startTime, timingChange);

    const effectPoint = new EffectPoint();

    effectPoint.kiai = (effects & EffectType.Kiai) > 0;
    effectPoint.omitFirstBarLine = (effects & EffectType.OmitFirstBarLine) > 0;

    if (beatmap.originalMode === 1 || beatmap.originalMode === 3) {
      effectPoint.scrollSpeed = speedMultiplier;
    }

    this.addControlPoint(effectPoint, startTime, timingChange);

    const samplePoint = new SamplePoint();

    samplePoint.sampleSet = sampleSet;
    samplePoint.customIndex = customIndex;
    samplePoint.volume = volume;
    this.addControlPoint(samplePoint, startTime, timingChange);
  }
  static addControlPoint(point, time, timingChange) {
    if (time !== this.pendingTime) {
      this.flushPendingPoints();
    }

    timingChange
      ? this.pendingPoints.unshift(point)
      : this.pendingPoints.push(point);

    this.pendingTime = time;
  }
  static flushPendingPoints() {
    const pendingTime = this.pendingTime;
    const pendingPoints = this.pendingPoints;
    const controlPoints = this.controlPoints;
    const pendingTypes = this.pendingTypes;
    let i = pendingPoints.length;

    while (--i >= 0) {
      if (pendingTypes.includes(pendingPoints[i].pointType)) {
        continue;
      }

      pendingTypes.push(pendingPoints[i].pointType);
      controlPoints.add(pendingPoints[i], pendingTime);
    }

    this.pendingPoints = [];
    this.pendingTypes = [];
  }
}
BeatmapTimingPointDecoder.pendingTime = 0;
BeatmapTimingPointDecoder.pendingTypes = [];
BeatmapTimingPointDecoder.pendingPoints = [];

class ReplayDecoder {
  static decodeLifeBar(data) {
    if (!data) {
      return [];
    }

    const lifeBarFrames = [];
    const frames = data.split(",");

    for (let i = 0; i < frames.length; ++i) {
      if (!frames[i]) {
        continue;
      }

      const frameData = frames[i].split("|");

      if (frameData.length < 2) {
        continue;
      }

      const frame = this.handleLifeBarFrame(frameData);

      lifeBarFrames.push(frame);
    }

    return lifeBarFrames;
  }
  static handleLifeBarFrame(frameData) {
    return new LifeBarFrame(
      Parsing.parseInt(frameData[0]),
      Parsing.parseFloat(frameData[1])
    );
  }
  static decodeReplayFrames(data) {
    if (!data) {
      return [];
    }

    let lastTime = 0;
    const replayFrames = [];
    const frames = data.split(",");

    for (let i = 0; i < frames.length; ++i) {
      if (!frames[i]) {
        continue;
      }

      const frameData = frames[i].split("|");

      if (frameData.length < 4) {
        continue;
      }

      if (frameData[0] === "-12345") {
        continue;
      }

      const replayFrame = this.handleReplayFrame(frameData);

      lastTime += replayFrame.interval;

      if (i < 2 && replayFrame.mouseX === 256 && replayFrame.mouseY === -500) {
        continue;
      }

      if (replayFrame.interval < 0) {
        continue;
      }

      replayFrame.startTime = lastTime;
      replayFrames.push(replayFrame);
    }

    return replayFrames;
  }
  static handleReplayFrame(frameData) {
    return new LegacyReplayFrame(
      0.0,
      Parsing.parseFloat(frameData[0]),
      new Vector2(
        Parsing.parseFloat(frameData[1], Parsing.MAX_COORDINATE_VALUE),
        Parsing.parseFloat(frameData[2], Parsing.MAX_COORDINATE_VALUE)
      ),
      Parsing.parseInt(frameData[3])
    );
  }
}

class SerializationReader {
  constructor(buffer) {
    this._bytesRead = 0;
    this.view = new DataView(new Uint8Array(buffer).buffer);
  }
  get bytesRead() {
    return this._bytesRead;
  }
  get remainingBytes() {
    return this.view.byteLength - this._bytesRead;
  }
  readByte() {
    return this.view.getUint8(this._bytesRead++);
  }
  readBytes(length) {
    const bytes = this.view.buffer.slice(
      this._bytesRead,
      this._bytesRead + length
    );

    this._bytesRead += length;

    return new Uint8Array(bytes);
  }
  readShort() {
    const value = this.view.getUint16(this._bytesRead, true);

    this._bytesRead += 2;

    return value;
  }
  readInteger() {
    const value = this.view.getInt32(this._bytesRead, true);

    this._bytesRead += 4;

    return value;
  }
  readLong() {
    const value = this.view.getBigInt64(this._bytesRead, true);

    this._bytesRead += 8;

    return value;
  }
  readDate() {
    const epochTicks = 62135596800000;

    return new Date(Number(this.readLong() / BigInt(1e4)) - epochTicks);
  }
  readULEB128() {
    let val = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = this.readByte();
      val |= (byte & 0x7f) << shift;
      shift += 7;
    } while ((byte & 0x80) !== 0);

    return val;
  }
  readString() {
    if (this.readByte() !== 0x0b) {
      return "";
    }

    const length = this.readULEB128();

    return length > 0 ? stringifyBuffer(this.readBytes(length)) : "";
  }
}

class StoryboardGeneralDecoder {
  static handleLine(line, storyboard) {
    const [key, ...values] = line.split(":").map((v) => v.trim());
    const value = values.join(" ");

    switch (key) {
      case "UseSkinSprites":
        storyboard.useSkinSprites = value === "1";
    }
  }
}

class StoryboardVariableDecoder {
  static handleLine(line, variables) {
    if (!line.startsWith("$")) {
      return;
    }

    const pair = line.split("=");

    if (pair.length === 2) {
      variables.set(pair[0], pair[1].trimEnd());
    }
  }
  static decodeVariables(line, variables) {
    if (!line.includes("$") || !variables.size) {
      return line;
    }

    variables.forEach((value, key) => {
      line = line.replace(key, value);
    });

    return line;
  }
}

class Decoder {
  async _getFileBuffer(path) {
    try {
      await browserFSOperation(path);
    } catch {
      throw new Error("File doesn't exist!");
    }

    try {
      return await browserFSOperation(path);
    } catch {
      throw new Error("File can't be read!");
    }
  }
  async _getFileUpdateDate(path) {
    try {
      return (await browserFSOperation(path)).mtime;
    } catch {
      throw new Error("Failed to get last file update date!");
    }
  }
}

class SectionMap extends Map {
  constructor() {
    super(...arguments);
    this.currentSection = null;
  }
  get(section) {
    let _a;

    return (_a = super.get(section)) !== null && _a !== void 0 ? _a : false;
  }
  set(section, state = true) {
    return super.set(section, state);
  }
  reset() {
    this.forEach((_, key, map) => {
      map.set(key, true);
    });

    this.currentSection = null;

    return this;
  }
  get hasEnabledSections() {
    for (const state of this.values()) {
      if (state) {
        return true;
      }
    }

    return false;
  }
  get isSectionEnabled() {
    return this.currentSection ? this.get(this.currentSection) : false;
  }
}

class SectionDecoder extends Decoder {
  constructor() {
    super(...arguments);
    this._lines = null;
    this._sectionMap = new SectionMap();
  }
  _getLines(data) {
    let lines = null;

    if (data.constructor === Array) {
      lines = data;
    }

    if (!lines || !lines.length) {
      throw new Error("Data not found!");
    }

    return lines;
  }
  _parseLine(line, output) {
    if (this._shouldSkipLine(line)) {
      return LineType.Empty;
    }

    line = this._preprocessLine(line);

    if (line.includes("osu file format v")) {
      return LineType.FileFormat;
    }

    if (line.startsWith("[") && line.endsWith("]")) {
      const section = line.slice(1, -1);

      if (this._sectionMap.currentSection) {
        this._sectionMap.set(this._sectionMap.currentSection, false);
        this._sectionMap.currentSection = null;
      }

      if (!this._sectionMap.hasEnabledSections) {
        return LineType.Break;
      }

      if (section in Section) {
        this._sectionMap.currentSection = section;
      }

      return LineType.Section;
    }

    if (!this._sectionMap.isSectionEnabled) {
      return LineType.Empty;
    }

    try {
      this._parseSectionData(line, output);

      return LineType.Data;
    } catch {
      return LineType.Empty;
    }
  }
  _parseSectionData(line, output) {
    const outputWithColors = output;

    if (this._sectionMap.currentSection !== Section.Colours) {
      return;
    }

    if (
      !(outputWithColors === null || outputWithColors === void 0
        ? void 0
        : outputWithColors.colors)
    ) {
      return;
    }

    BeatmapColorDecoder.handleLine(line, outputWithColors);
  }
  _preprocessLine(line) {
    if (this._sectionMap.currentSection !== Section.Metadata) {
      line = this._stripComments(line);
    }

    return line.trimEnd();
  }
  _shouldSkipLine(line) {
    return typeof line !== "string" || !line || line.startsWith("//");
  }
  _stripComments(line) {
    const index = line.indexOf("//");

    return index > 0 ? line.substring(0, index) : line;
  }
  _reset() {
    this._sectionMap.reset();
    this._lines = null;
  }
  _setEnabledSections(options) {
    this._sectionMap.set(
      Section.Colours,
      options === null || options === void 0 ? void 0 : options.parseColours
    );
  }
}

class StoryboardDecoder extends SectionDecoder {
  constructor() {
    super(...arguments);
    this._variables = new Map();
  }
  async decodeFromPath(firstPath, secondPath) {
    if (
      !firstPath.endsWith(FileFormat.Beatmap) &&
      !firstPath.endsWith(FileFormat.Storyboard)
    ) {
      throw new Error(
        `Wrong format of the first file! Only ${FileFormat.Beatmap} and ${FileFormat.Storyboard} files are supported!`
      );
    }

    if (typeof secondPath === "string") {
      if (!secondPath.endsWith(FileFormat.Storyboard)) {
        throw new Error(
          `Wrong format of the second file! Only ${FileFormat.Storyboard} files are supported as a second argument!`
        );
      }
    }

    try {
      const firstData = await this._getFileBuffer(firstPath);
      const secondData =
        typeof secondPath === "string"
          ? await this._getFileBuffer(firstPath)
          : undefined;

      return this.decodeFromBuffer(firstData, secondData);
    } catch (err) {
      const reason = err.message || err;
      throw new Error(`Failed to decode a storyboard: '${reason}'`);
    }
  }
  decodeFromBuffer(firstBuffer, secondBuffer) {
    const firstString = stringifyBuffer(firstBuffer);
    const secondString = secondBuffer
      ? stringifyBuffer(secondBuffer)
      : undefined;

    return this.decodeFromString(firstString, secondString);
  }
  decodeFromString(firstString, secondString) {
    if (typeof firstString !== "string") {
      firstString = String(firstString);
    }

    if (
      typeof secondString !== "string" &&
      typeof secondString !== "undefined"
    ) {
      secondString = String(secondString);
    }

    const firstData = firstString.split(/\r?\n/);
    const secondData =
      secondString === null || secondString === void 0
        ? void 0
        : secondString.split(/\r?\n/);

    return this.decodeFromLines(firstData, secondData);
  }
  decodeFromLines(firstData, secondData) {
    const storyboard = new Storyboard();

    this._reset();
    this._setEnabledSections();
    this._lines = [
      ...this._getLines(firstData),
      ...(secondData ? this._getLines(secondData) : []),
    ];

    for (let i = 0; i < this._lines.length; ++i) {
      const type = this._parseLine(this._lines[i], storyboard);

      if (type === LineType.Break) {
        break;
      }
    }

    storyboard.variables = this._variables;

    return storyboard;
  }
  _parseLine(line, storyboard) {
    if (line.includes("osu file format v")) {
      storyboard.fileFormat = Parsing.parseInt(line.split("v")[1]);

      return LineType.FileFormat;
    }

    return super._parseLine(line, storyboard);
  }
  _parseSectionData(line, storyboard) {
    switch (this._sectionMap.currentSection) {
      case Section.General:
        return StoryboardGeneralDecoder.handleLine(line, storyboard);
      case Section.Events:
        return StoryboardEventDecoder.handleLine(line, storyboard);
      case Section.Variables:
        return StoryboardVariableDecoder.handleLine(line, this._variables);
    }

    super._parseSectionData(line, storyboard);
  }
  _setEnabledSections() {
    super._setEnabledSections();
    this._sectionMap.set(Section.General);
    this._sectionMap.set(Section.Variables);
    this._sectionMap.set(Section.Events);
  }
  _preprocessLine(line) {
    line = StoryboardVariableDecoder.decodeVariables(line, this._variables);

    return super._preprocessLine(line);
  }
  _reset() {
    super._reset();
    this._sectionMap.reset();
    this._sectionMap.currentSection = Section.Events;
  }
}

class BeatmapDecoder extends SectionDecoder {
  constructor() {
    super(...arguments);
    this._offset = 0;
    this._sbLines = null;
  }
  async decodeFromPath(path, options) {
    if (!path.endsWith(FileFormat.Beatmap)) {
      throw new Error(
        `Wrong file format! Only ${FileFormat.Beatmap} files are supported!`
      );
    }

    try {
      const data = await this._getFileBuffer(path);
      const beatmap = this.decodeFromBuffer(data, options);

      beatmap.fileUpdateDate = await this._getFileUpdateDate(path);

      return beatmap;
    } catch (err) {
      const reason = err.message || err;
      throw new Error(`Failed to decode a beatmap: ${reason}`);
    }
  }
  decodeFromBuffer(data, options) {
    return this.decodeFromString(stringifyBuffer(data), options);
  }
  decodeFromString(str, options) {
    str = typeof str !== "string" ? String(str) : str;

    return this.decodeFromLines(str.split(/\r?\n/), options);
  }
  decodeFromLines(data, options) {
    const beatmap = new Beatmap();

    this._reset();
    this._lines = this._getLines(data);
    this._setEnabledSections(typeof options !== "boolean" ? options : {});
    this._sbLines = this._shouldParseStoryboard(options) ? [] : null;

    const fileFormatLine = this._lines[0].trim();

    if (!fileFormatLine.startsWith("osu file format v")) {
      throw new Error("Not a valid beatmap!");
    }

    for (let i = 0; i < this._lines.length; ++i) {
      const type = this._parseLine(this._lines[i], beatmap);

      if (type === LineType.Break) {
        break;
      }
    }

    BeatmapTimingPointDecoder.flushPendingPoints();

    for (let i = 0; i < beatmap.hitObjects.length; ++i) {
      beatmap.hitObjects[i].applyDefaults(
        beatmap.controlPoints,
        beatmap.difficulty
      );
    }

    beatmap.hitObjects.sort((a, b) => a.startTime - b.startTime);

    if (this._sbLines && this._sbLines.length) {
      const storyboardDecoder = new StoryboardDecoder();

      beatmap.events.storyboard = storyboardDecoder.decodeFromLines(
        this._sbLines
      );
      beatmap.events.storyboard.useSkinSprites = beatmap.general.useSkinSprites;
      beatmap.events.storyboard.colors = beatmap.colors;
      beatmap.events.storyboard.fileFormat = beatmap.fileFormat;
    }

    return beatmap;
  }
  _parseLine(line, beatmap) {
    if (line.includes("osu file format v")) {
      beatmap.fileFormat = Parsing.parseInt(line.split("v")[1]);

      return LineType.FileFormat;
    }

    return super._parseLine(line, beatmap);
  }
  _parseSectionData(line, beatmap) {
    switch (this._sectionMap.currentSection) {
      case Section.General:
        return BeatmapGeneralDecoder.handleLine(line, beatmap, this._offset);
      case Section.Editor:
        return BeatmapEditorDecoder.handleLine(line, beatmap);
      case Section.Metadata:
        return BeatmapMetadataDecoder.handleLine(line, beatmap);
      case Section.Difficulty:
        return BeatmapDifficultyDecoder.handleLine(line, beatmap);
      case Section.Events:
        return BeatmapEventDecoder.handleLine(
          line,
          beatmap,
          this._sbLines,
          this._offset
        );
      case Section.TimingPoints:
        return BeatmapTimingPointDecoder.handleLine(
          line,
          beatmap,
          this._offset
        );
      case Section.HitObjects:
        return BeatmapHitObjectDecoder.handleLine(line, beatmap, this._offset);
    }

    super._parseSectionData(line, beatmap);
  }
  _setEnabledSections(options) {
    super._setEnabledSections(options);
    this._sectionMap.set(
      Section.General,
      options === null || options === void 0 ? void 0 : options.parseGeneral
    );
    this._sectionMap.set(
      Section.Editor,
      options === null || options === void 0 ? void 0 : options.parseEditor
    );
    this._sectionMap.set(
      Section.Metadata,
      options === null || options === void 0 ? void 0 : options.parseMetadata
    );
    this._sectionMap.set(
      Section.Difficulty,
      options === null || options === void 0 ? void 0 : options.parseDifficulty
    );
    this._sectionMap.set(
      Section.Events,
      options === null || options === void 0 ? void 0 : options.parseEvents
    );
    this._sectionMap.set(
      Section.TimingPoints,
      options === null || options === void 0
        ? void 0
        : options.parseTimingPoints
    );
    this._sectionMap.set(
      Section.HitObjects,
      options === null || options === void 0 ? void 0 : options.parseHitObjects
    );
  }
  _shouldParseStoryboard(options) {
    let _a, _b;
    const parsingOptions = options;
    const storyboardFlag =
      (_a =
        parsingOptions === null || parsingOptions === void 0
          ? void 0
          : parsingOptions.parseStoryboard) !== null && _a !== void 0
        ? _a
        : options;
    const parseSb = typeof storyboardFlag === "boolean" ? storyboardFlag : true;
    const parseEvents =
      (_b =
        parsingOptions === null || parsingOptions === void 0
          ? void 0
          : parsingOptions.parseEvents) !== null && _b !== void 0
        ? _b
        : true;

    return parseEvents && parseSb;
  }
}
BeatmapDecoder.EARLY_VERSION_TIMING_OFFSET = 24;

class ScoreDecoder extends Decoder {
  async decodeFromPath(path, parseReplay = true) {
    if (!path.endsWith(FileFormat.Replay)) {
      throw new Error(
        `Wrong file format! Only ${FileFormat.Replay} files are supported!`
      );
    }

    try {
      const data = await this._getFileBuffer(path);

      return await this.decodeFromBuffer(data, parseReplay);
    } catch (err) {
      const reason = err.message || err;
      throw new Error(`Failed to decode a score: '${reason}'`);
    }
  }
  async decodeFromBuffer(buffer, parseReplay = true) {
    const reader = new SerializationReader(buffer);
    const scoreInfo = new ScoreInfo();
    let replay = null;

    try {
      scoreInfo.rulesetId = reader.readByte();

      const gameVersion = reader.readInteger();

      scoreInfo.beatmapHashMD5 = reader.readString();
      scoreInfo.username = reader.readString();

      const replayHashMD5 = reader.readString();

      scoreInfo.count300 = reader.readShort();
      scoreInfo.count100 = reader.readShort();
      scoreInfo.count50 = reader.readShort();
      scoreInfo.countGeki = reader.readShort();
      scoreInfo.countKatu = reader.readShort();
      scoreInfo.countMiss = reader.readShort();
      scoreInfo.totalScore = reader.readInteger();
      scoreInfo.maxCombo = reader.readShort();
      scoreInfo.perfect = !!reader.readByte();
      scoreInfo.rawMods = reader.readInteger();

      const lifeData = reader.readString();

      scoreInfo.date = reader.readDate();

      const replayLength = reader.readInteger();
      const compressedBytes = reader.readBytes(replayLength);

      if (parseReplay && replayLength > 0) {
        replay = new Replay();

        const replayData = await LZMA.decompress(compressedBytes);
        const replayString = stringifyBuffer(replayData);

        replay.rawFrames = replayString;
        replay.mode = scoreInfo.rulesetId;
        replay.gameVersion = gameVersion;
        replay.hashMD5 = replayHashMD5;
        replay.frames = ReplayDecoder.decodeReplayFrames(replayString);
        replay.lifeBar = ReplayDecoder.decodeLifeBar(lifeData);
      }

      scoreInfo.id = this._parseScoreId(gameVersion, reader);

      return new Score(scoreInfo, replay);
    } catch {
      return new Score(scoreInfo, replay);
    }
  }
  _parseScoreId(version, reader) {
    if (version >= 20140721) {
      return Number(reader.readLong());
    }

    if (version >= 20121008) {
      return reader.readInteger();
    }

    return 0;
  }
}

export {
  BeatmapDecoder,
  BeatmapEncoder,
  HittableObject,
  HoldableObject,
  ScoreDecoder,
  ScoreEncoder,
  SlidableObject,
  SpinnableObject,
  StoryboardDecoder,
  StoryboardEncoder,
};
