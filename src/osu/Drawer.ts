import { Vector2 } from "osu-classes";
import { Md5 } from "ts-md5";
import p5 from "p5";
import { loadImageAsync } from "@/utils";

export class Drawer {
  private static imageCache: Record<string, p5.Graphics> = {};
  static images = {
    cursor: undefined as any as p5.Image,
    cursortrail: undefined as any as p5.Image,
    hitcircle: undefined as any as p5.Image,
    hitcircleoverlay: undefined as any as p5.Image,
    radix: undefined as any as p5.Image,
    sliderfollowcircle: undefined as any as p5.Image,
    sliderb0: undefined as any as p5.Image,
    default0: undefined as any as p5.Image,
    default1: undefined as any as p5.Image,
    default2: undefined as any as p5.Image,
    default3: undefined as any as p5.Image,
    default4: undefined as any as p5.Image,
    default5: undefined as any as p5.Image,
    default6: undefined as any as p5.Image,
    default7: undefined as any as p5.Image,
    default8: undefined as any as p5.Image,
    default9: undefined as any as p5.Image,
  };
  private static p: p5;

  static setP(_p: p5) {
    this.p = _p;
  }

  static async loadDefaultImages() {
    for (const imageName of Object.keys(Drawer.images)) {
      Drawer.images[imageName as keyof typeof Drawer.images] =
        await loadImageAsync(`/${imageName}.png`);
    }
  }

  static setImages(images: typeof this.images) {
    this.images = images;
  }

  static setDrawingOpacity(opacity: number) {
    //@ts-ignore
    this.p.drawingContext.globalAlpha = opacity;
  }

  static drawCircleJudgement(
    position: Vector2,
    radius: number,
    judgement: string
  ) {
    Drawer.p.push();
    Drawer.p.strokeWeight(2);
    if (judgement === "OK") {
      Drawer.p.stroke(`rgb(106, 176, 76)`);
      Drawer.p.fill(`rgb(106, 176, 76)`);
    }
    if (judgement === "MEH") {
      Drawer.p.stroke(`rgb(241, 196, 15)`);
      Drawer.p.fill(`rgb(241, 196, 15)`);
    }
    if (judgement === "MISS") {
      Drawer.p.stroke(`rgb(231, 76, 60)`);
      Drawer.p.fill(`rgb(231, 76, 60)`);
    }
    if (judgement !== "GREAT") {
      Drawer.p.circle(position.x, position.y, radius * 2);
    }
    Drawer.p.pop();
  }

  static drawSliderFollowPoint(position: Vector2, radius: number) {
    Drawer.p.image(
      this.images.sliderfollowcircle,
      position.x,
      position.y,
      radius * 2,
      radius * 2
    );
    Drawer.p.push();
    Drawer.p.fill(255, 255, 255, 18);
    Drawer.p.circle(position.x, position.y, radius * 4);
    Drawer.p.pop();
  }

  static drawHitCircle(position: Vector2, radius: number, comboNumber: number) {
    Drawer.p.push();
    Drawer.p.noStroke();
    Drawer.p.fill(160);
    Drawer.p.image(
      this.images.hitcircle,
      position.x,
      position.y,
      radius * 2,
      radius * 2
    );
    Drawer.p.image(
      this.images.hitcircleoverlay,
      position.x,
      position.y,
      radius * 2,
      radius * 2
    );
    this.drawNumberWithSprites(
      comboNumber + 1,
      new Vector2(position.x - 0.5, position.y),
      radius * 0.4
    );

    Drawer.p.pop();
  }

  static drawApproachCircle(
    position: Vector2,
    radius: number,
    arScale: number
  ) {
    if (arScale == 1) return;
    Drawer.p.push();
    Drawer.p.noFill();
    Drawer.p.stroke("white");
    Drawer.p.strokeWeight(3);
    Drawer.p.circle(position.x, position.y, radius * 2 * arScale);
    Drawer.p.pop();
  }

  static drawSliderBody(origin: Vector2, path: Vector2[], radius: number) {
    Drawer.p.push();

    const cacheKey = Md5.hashStr(JSON.stringify(path) + JSON.stringify(radius));
    if (!this.imageCache[cacheKey]) {
      const g = Drawer.p.createGraphics(512 * 4, 384 * 4);
      g.scale(2);
      g.translate(512 - 256, 384 - 192);
      //@ts-ignore
      const ctx = g.drawingContext;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      g.translate(origin.x, origin.y);
      g.noFill();

      g.strokeWeight(radius * 2 - 10);

      g.stroke(255);
      g.beginShape();
      for (const node of path) {
        g.vertex(node.x, node.y);
      }
      g.endShape();

      g.strokeWeight(radius * 2 - (10 + radius * 0.25));
      g.stroke(10);
      g.beginShape();
      for (const node of path) {
        g.vertex(node.x, node.y);
      }

      g.endShape();

      for (let i = 0; i < radius * 2 - 17; i += 2) {
        g.strokeWeight(radius * 2 - 17 - i);
        g.stroke(Math.round((i / (radius * 2 - 17)) * 45));
        g.beginShape();
        for (const node of path) {
          g.vertex(node.x, node.y);
        }

        g.endShape();
      }

      this.imageCache[cacheKey] = g;
    }
    Drawer.p.imageMode(Drawer.p.CORNER);
    Drawer.p.image(this.imageCache[cacheKey], -256, -192, 512 * 2, 384 * 2);

    Drawer.p.pop();
  }

  static drawCursorPath(
    path: {
      position: Vector2;
      button: {
        mouseLeft1: boolean;
        mouseLeft2: boolean;
        mouseRight1: boolean;
        mouseRight2: boolean;
      };
    }[],
    cursor: {
      position: Vector2;
      button: {
        mouseLeft1: boolean;
        mouseLeft2: boolean;
        mouseRight1: boolean;
        mouseRight2: boolean;
      };
    }
  ) {
    Drawer.p.push();
    //@ts-ignore
    const ctx = Drawer.p.drawingContext;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    Drawer.p.noFill();

    Drawer.p.push();
    Drawer.p.strokeWeight(2.5);
    Drawer.p.stroke("black");
    for (let i = 1; i < path.length; i++) {
      const lastFrame = path[i - 1];
      const frame = path[i];

      Drawer.p.line(
        lastFrame.position.x,
        lastFrame.position.y,
        frame.position.x,
        frame.position.y
      );
    }

    Drawer.p.pop();
    Drawer.p.strokeWeight(1.5);
    Drawer.p.stroke("white");

    for (let i = 1; i < path.length; i++) {
      const lastFrame = path[i - 1];
      const frame = path[i];
      Drawer.p.stroke("white");

      if (lastFrame.button.mouseLeft1 || lastFrame.button.mouseLeft2) {
        Drawer.p.stroke("#BB6BD9");
      }
      if (lastFrame.button.mouseRight1 || lastFrame.button.mouseRight2) {
        Drawer.p.stroke("#F2994A");
      }
      if (lastFrame.button.mouseLeft1 && lastFrame.button.mouseRight1) {
        Drawer.p.stroke("red");
      }
      Drawer.p.line(
        lastFrame.position.x,
        lastFrame.position.y,
        frame.position.x,
        frame.position.y
      );
    }

    if (cursor.position)
      Drawer.p.image(
        this.images.cursor,
        cursor.position.x,
        cursor.position.y,
        55,
        55
      );

    Drawer.p.pop();
  }
  static drawNumberWithSprites(
    number: number,
    position: Vector2,
    size: number
  ) {
    Drawer.p.push();
    Drawer.p.imageMode(Drawer.p.CORNER);
    const digits = number.toString().split("");
    const digitWidth = size;
    const digitHeight = size * 1.2;
    const digitSpacing = -size * 0.1;
    const totalWidth = digits.length * (digitWidth + digitSpacing);
    const x = position.x - totalWidth / 2;
    const y = position.y - digitHeight / 2;
    digits.forEach((digit, index) => {
      const indexer = `default${digit}`;
      const image = this.images[indexer as keyof typeof this.images];
      Drawer.p.image(
        image,
        x + index * (digitWidth + digitSpacing),
        y,
        digitWidth,
        digitHeight
      );
    });
    Drawer.p.pop();
  }
  static drawField() {
    Drawer.p.noFill();
    Drawer.p.stroke(255, 255, 255, 60);
    Drawer.p.rect(0, 0, 512, 384, 4);
  }

  static beginDrawing() {
    Drawer.p.push();
  }
  static endDrawing() {
    Drawer.p.pop();
  }
}
