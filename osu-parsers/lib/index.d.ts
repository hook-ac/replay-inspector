import { Beatmap, Storyboard, Score, IBeatmap, IScore, HitObject, IHasCombo, IHoldableObject, HitSample, ISlidableObject, SliderPath, ControlPointInfo, BeatmapDifficultySection, ISpinnableObject } from 'osu-classes';

declare enum LineType {
  FileFormat = 0,
  Section = 1,
  Empty = 2,
  Data = 3,
  Break = 4
}

declare enum Section {
  General = 'General',
  Editor = 'Editor',
  Metadata = 'Metadata',
  Difficulty = 'Difficulty',
  Events = 'Events',
  TimingPoints = 'TimingPoints',
  Colours = 'Colours',
  HitObjects = 'HitObjects',
  Variables = 'Variables',
  Fonts = 'Fonts',
  CatchTheBeat = 'CatchTheBeat',
  Mania = 'Mania'
}

interface IParsingOptions {
  /**
   * Whether to parse colour section or not.
   * This section is only required for beatmap & storyboard rendering stuff
   * and doesn't affect beatmap parsing and difficulty & performance calculation at all.
   */
  parseColours?: boolean;
}
interface IBeatmapParsingOptions extends IParsingOptions {
  /**
   * Whether to parse general section or not.
   * This section contains very important data like beatmap mode or file format
   * and should not be omitted unless you really need to. Different beatmap file formats
   * can significantly affect beatmap parsing and difficulty & performance calculations.
   */
  parseGeneral?: boolean;
  /**
   * Whether to parse editor section or not.
   * This section isn't required anywhere so it can be disabled safely.
   */
  parseEditor?: boolean;
  /**
   * Whether to parse metadata section or not.
   * This section isn't required anywhere so it can be disabled safely.
   */
  parseMetadata?: boolean;
  /**
   * Whether to parse difficulty section or not.
   * This section is required for hit object processing and difficulty & performance calculations.
   */
  parseDifficulty?: boolean;
  /**
   * Whether to parse events section or not.
   * Events section contains information about breaks, background and storyboard.
   * Changing this will also affects storyboard parsing.
   */
  parseEvents?: boolean;
  /**
   * Whether to parse timing point section or not.
   * Timing points are required for internal hit object processing.
   */
  parseTimingPoints?: boolean;
  /**
   * Whether to parse hit object section or not.
   * If you don't need hit objects you can safely disable this section.
   */
  parseHitObjects?: boolean;
  /**
   * Whether to parse storyboard or not.
   * If you don't need storyboard you can safely disable this section.
   */
  parseStoryboard?: boolean;
}

/**
 * A basic decoder for readable file formats.
 */
declare abstract class Decoder {
  /**
   * Tries to read a file by its path in file system.
   * @param path A path to the file.
   * @throws If file doesn't exist or it can't be read.
   * @returns A file buffer.
   */
  protected _getFileBuffer(path: string): Promise<Uint8Array>;
  /**
   * Tries to get last update date of a file by its path in file system.
   * @param path A path to the file.
   * @throws If file can't be read.
   * @returns Last file update date.
   */
  protected _getFileUpdateDate(path: string): Promise<Date>;
}

declare class SectionMap extends Map<Section, boolean> {
  /**
   * Current section of this map.
   */
  currentSection: Section | null;
  /**
   * Gets the current state of the specified section.
   * @param section Section name.
   * @returns Current state of the section.
   */
  get(section: Section): boolean;
  /**
   * Sets the state of the specified section.
   * @param section Section name.
   * @param state State of the section.
   * @returns Reference to this section map.
   */
  set(section: Section, state?: boolean): this;
  /**
   * Resets all section states to enabled and removes current section.
   * @returns Reference to this section map.
   */
  reset(): this;
  get hasEnabledSections(): boolean;
  /**
   * Check if current section is enabled and should be parsed.
   * Unknown sections are disabled by default.
   * @returns If this section is enabled.
   */
  get isSectionEnabled(): boolean;
}

/**
 * A decoder for human-readable file formats that consist of sections.
 */
declare abstract class SectionDecoder<T> extends Decoder {
  /**
   * Current data lines.
   */
  protected _lines: string[] | null;
  /**
   * Section map of this decoder.
   */
  protected _sectionMap: SectionMap;
  protected _getLines(data: any[]): string[];
  protected _parseLine(line: string, output: T): LineType;
  protected _parseSectionData(line: string, output: T): void;
  protected _preprocessLine(line: string): string;
  protected _shouldSkipLine(line: string): boolean;
  protected _stripComments(line: string): string;
  protected _reset(): void;
  /**
   * Sets current enabled sections.
   * All known sections are enabled by default.
   * @param options Parsing options.
   */
  protected _setEnabledSections(options?: IParsingOptions): void;
}

declare type BufferLike = ArrayBufferLike | Uint8Array;

/**
 * A beatmap decoder.
 */
declare class BeatmapDecoder extends SectionDecoder<Beatmap> {
  /**
   * An offset which needs to be applied to old beatmaps (v4 and lower)
   * to correct timing changes that were applied at a game client level.
   */
  static readonly EARLY_VERSION_TIMING_OFFSET = 24;
  /**
   * Current offset for all time values.
   */
  protected _offset: number;
  /**
   * Current storyboard lines.
   */
  protected _sbLines: string[] | null;
  /**
   * Performs beatmap decoding from the specified .osu file.
   * @param path A path to the .osu file.
   * @param options Beatmap parsing options.
   * Setting this to boolean will only affect storyboard parsing.
   * All sections that weren't specified will be enabled by default.
   * @throws If file doesn't exist or can't be decoded.
   * @returns A decoded beatmap.
   */
  decodeFromPath(path: string, options?: boolean | IBeatmapParsingOptions): Promise<Beatmap>;
  /**
   * Performs beatmap decoding from a data buffer.
   * @param data The buffer with beatmap data.
   * @param options Beatmap parsing options.
   * Setting this to boolean will only affect storyboard parsing.
   * All sections that weren't specified will be enabled by default.
   * @throws If beatmap data can't be decoded.
   * @returns A decoded beatmap.
   */
  decodeFromBuffer(data: BufferLike, options?: boolean | IBeatmapParsingOptions): Beatmap;
  /**
   * Performs beatmap decoding from a string.
   * @param str The string with beatmap data.
   * @param options Beatmap parsing options.
   * Setting this to boolean will only affect storyboard parsing.
   * All sections that weren't specified will be enabled by default.
   * @throws If beatmap data can't be decoded.
   * @returns A decoded beatmap.
   */
  decodeFromString(str: string, options?: boolean | IBeatmapParsingOptions): Beatmap;
  /**
   * Performs beatmap decoding from a string array.
   * @param data The array of split lines.
   * @param options Beatmap parsing options.
   * Setting this to boolean will only affect storyboard parsing.
   * @throws If beatmap data can't be decoded.
   * @returns A decoded beatmap.
   */
  decodeFromLines(data: string[], options?: boolean | IBeatmapParsingOptions): Beatmap;
  protected _parseLine(line: string, beatmap: Beatmap): LineType;
  protected _parseSectionData(line: string, beatmap: Beatmap): void;
  /**
   * Sets current enabled sections.
   * All known sections are enabled by default.
   * @param options Parsing options.
   */
  protected _setEnabledSections(options?: IBeatmapParsingOptions): void;
  protected _shouldParseStoryboard(options?: boolean | IBeatmapParsingOptions): boolean;
}

/**
 * A storyboard decoder.
 */
declare class StoryboardDecoder extends SectionDecoder<Storyboard> {
  /**
   * Current section name.
   */
  private _variables;
  /**
   * Performs storyboard decoding from the specified `.osu` or `.osb` file.
   * If two paths were specified, storyboard decoder will try to combine storyboards.
   *
   * NOTE: Commands from the `.osb` file take precedence over those
   * from the `.osu` file within the layers, as if the commands
   * from the `.osb` were appended to the end of the `.osu` commands.
   * @param firstPath The path to the main storyboard (`.osu` or `.osb` file).
   * @param secondPath The path to the secondary storyboard (`.osb` file).
   * @throws If file doesn't exist or can't be decoded.
   * @returns A decoded storyboard.
   */
  decodeFromPath(firstPath: string, secondPath?: string): Promise<Storyboard>;
  /**
   * Performs storyboard decoding from a data buffer.
   * If two data buffers were specified, storyboard decoder will try to combine storyboards.
   *
   * NOTE: Commands from the `.osb` file take precedence over those
   * from the `.osu` file within the layers, as if the commands
   * from the `.osb` were appended to the end of the `.osu` commands.
   * @param firstBuffer The buffer with the main storyboard data (from `.osu` or `.osb` file).
   * @param secondBuffer The buffer with the secondary storyboard data (from `.osb` file).
   * @throws If storyboard data can't be decoded.
   * @returns A decoded storyboard.
   */
  decodeFromBuffer(firstBuffer: BufferLike, secondBuffer?: BufferLike): Storyboard;
  /**
   * Performs storyboard decoding from a string.
   * If two strings were specified, storyboard decoder will try to combine storyboards.
   *
   * NOTE: Commands from the `.osb` file take precedence over those
   * from the `.osu` file within the layers, as if the commands
   * from the `.osb` were appended to the end of the `.osu` commands.
   * @param firstString The string with the main storyboard data (from `.osu` or `.osb` file).
   * @param secondString The string with the secondary storyboard data (from `.osb` file).
   * @throws If storyboard data can't be decoded.
   * @returns A decoded storyboard.
   */
  decodeFromString(firstString: string, secondString?: string): Storyboard;
  /**
   * Performs storyboard decoding from a string array.
   * If two string arrays were specified, storyboard decoder will try to combine storyboards.
   *
   * NOTE: Commands from the `.osb` file take precedence over those
   * from the `.osu` file within the layers, as if the commands
   * from the `.osb` were appended to the end of the `.osu` commands.
   * @param firstData The string array with the main storyboard data (from `.osu` or `.osb` file).
   * @param secondData The string array with the secondary storyboard data (from `.osb` file).
   * @throws If storyboard data can't be decoded.
   * @returns A decoded storyboard.
   */
  decodeFromLines(firstData: string[], secondData?: string[]): Storyboard;
  protected _parseLine(line: string, storyboard: Storyboard): LineType;
  protected _parseSectionData(line: string, storyboard: Storyboard): void;
  /**
   * Sets current enabled sections.
   * All known sections are enabled by default.
   */
  protected _setEnabledSections(): void;
  protected _preprocessLine(line: string): string;
  protected _reset(): void;
}

/**
 * A score decoder.
 */
declare class ScoreDecoder extends Decoder {
  /**
   * Performs score decoding from the specified .osr file.
   * @param path A path to the .osr file.
   * @param parseReplay Should replay be parsed?
   * @throws If file doesn't exist or can't be decoded.
   * @returns A decoded score.
   */
  decodeFromPath(path: string, parseReplay?: boolean): Promise<Score>;
  /**
   * Performs score decoding from a buffer.
   * @param buffer The buffer with score data.
   * @param parseReplay Should replay be parsed?
   * @returns A decoded score.
   */
  decodeFromBuffer(buffer: BufferLike, parseReplay?: boolean): Promise<Score>;
  private _parseScoreId;
}

/**
 * A beatmap encoder.
 */
declare class BeatmapEncoder {
  /**
   * First playable lazer version.
   */
  static readonly FIRST_LAZER_VERSION = 128;
  /**
   * Performs beatmap encoding to the specified path.
   * @param path The path for writing the .osu file.
   * @param beatmap The beatmap for encoding.
   * @throws If beatmap can't be encoded or file can't be written.
   */
  encodeToPath(path: string, beatmap?: IBeatmap): Promise<void>;
  /**
   * Performs beatmap encoding to a string.
   * @param beatmap The beatmap for encoding.
   * @returns The string with encoded beatmap data.
   */
  encodeToString(beatmap?: IBeatmap): string;
}

/**
 * A storyboard encoder.
 */
declare class StoryboardEncoder {
  /**
   * Performs storyboard encoding to the specified path.
   * @param path The path for writing the .osb file.
   * @param storyboard The storyboard for encoding.
   * @throws If storyboard can't be encoded or file can't be written.
   */
  encodeToPath(path: string, storyboard?: Storyboard): Promise<void>;
  /**
   * Performs storyboard encoding to a string.
   * @param storyboard The storyboard for encoding.
   * @returns The string with encoded storyboard data.
   */
  encodeToString(storyboard?: Storyboard): string;
}

/**
 * A score encoder.
 */
declare class ScoreEncoder {
  /**
   * Default game version used if replay is not available.
   * It's just the last available osu!lazer version at the moment.
   */
  static DEFAULT_GAME_VERSION: number;
  /**
   * Performs score & replay encoding to the specified path.
   * @param path The path for writing the .osr file.
   * @param score The score for encoding.
   * @param beatmap The beatmap of the replay.
   * It is required if replay contains non-legacy frames.
   * @throws If score can't be encoded
   * @throws If beatmap wasn't provided for non-legacy replay.
   * @throws If score can't be encoded or file can't be written.
   */
  encodeToPath(path: string, score?: IScore, beatmap?: IBeatmap): Promise<void>;
  /**
   * Performs score encoding to a buffer.
   * @param score The score for encoding.
   * @param beatmap The beatmap of the replay.
   * It is required if replay contains non-legacy frames.
   * @throws If beatmap wasn't provided for non-legacy replay.
   * @returns The buffer with encoded score & replay data.
   */
  encodeToBuffer(score?: IScore, beatmap?: IBeatmap): Promise<Uint8Array>;
}

/**
 * A hittable object.
 */
declare class HittableObject extends HitObject implements IHasCombo {
  isNewCombo: boolean;
  comboOffset: number;
  /**
   * Creates a copy of this parsed hit.
   * Non-primitive properties will be copied via their own clone() method.
   * @returns A copied parsed slider.
   */
  clone(): this;
}

/**
 * A holdable object.
 */
declare class HoldableObject extends HitObject implements IHoldableObject {
  /**
   * The time at which the holdable object ends.
   */
  endTime: number;
  /**
   * The samples to be played when each node of the holdable object is hit.
   * 0: The first node.
   * 1: The first repeat.
   * 2: The second repeat.
   * ...
   * n-1: The last repeat.
   * n: The last node.
   */
  nodeSamples: HitSample[][];
  /**
   * The duration of the holdable object.
   */
  get duration(): number;
  /**
   * Creates a copy of this holdable object.
   * Non-primitive properties will be copied via their own clone() method.
   * @returns A copied holdable object.
   */
  clone(): this;
}

/**
 * A parsed slidable object.
 */
declare class SlidableObject extends HitObject implements ISlidableObject, IHasCombo {
  /**
   * Scoring distance with a speed-adjusted beat length of 1 second
   * (ie. the speed slider balls move through their track).
   */
  static BASE_SCORING_DISTANCE: number;
  /**
   * The duration of this slidable object.
   */
  get duration(): number;
  /**
   * The time at which the slidable object ends.
   */
  get endTime(): number;
  /**
   * The amount of times the length of this slidable object spans.
   */
  get spans(): number;
  set spans(value: number);
  /**
   * The duration of a single span of this slidable object.
   */
  get spanDuration(): number;
  /**
   * The positional length of a slidable object.
   */
  get distance(): number;
  set distance(value: number);
  /**
   * The amount of times a slidable object repeats.
   */
  repeats: number;
  /**
   * Velocity of this slidable object.
   */
  velocity: number;
  /**
   * The curve of a slidable object.
   */
  path: SliderPath;
  /**
   * The last tick offset of slidable objects in osu!stable.
   */
  legacyLastTickOffset: number;
  /**
   * The samples to be played when each node of the slidable object is hit.
   * 0: The first node.
   * 1: The first repeat.
   * 2: The second repeat.
   * ...
   * n-1: The last repeat.
   * n: The last node.
   */
  nodeSamples: HitSample[][];
  isNewCombo: boolean;
  comboOffset: number;
  applyDefaultsToSelf(controlPoints: ControlPointInfo, difficulty: BeatmapDifficultySection): void;
  /**
   * Creates a copy of this parsed slider.
   * Non-primitive properties will be copied via their own clone() method.
   * @returns A copied parsed slider.
   */
  clone(): this;
}

/**
 * A parsed spinnable object.
 */
declare class SpinnableObject extends HitObject implements ISpinnableObject, IHasCombo {
  /**
   * The time at which the spinnable object ends.
   */
  endTime: number;
  isNewCombo: boolean;
  comboOffset: number;
  /**
   * The duration of this spinnable object.
   */
  get duration(): number;
  /**
   * Creates a copy of this parsed spinner.
   * Non-primitive properties will be copied via their own clone() method.
   * @returns A copied parsed spinner.
   */
  clone(): this;
}

export { BeatmapDecoder, BeatmapEncoder, HittableObject, HoldableObject, ScoreDecoder, ScoreEncoder, SlidableObject, SpinnableObject, StoryboardDecoder, StoryboardEncoder };
