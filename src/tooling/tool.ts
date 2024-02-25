export abstract class Tool {
  abstract mousePressed(): void;
  abstract mouseReleased(): void;
  abstract tick(): void;
}
