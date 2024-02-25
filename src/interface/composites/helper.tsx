import middlemouse from "/mouse.svg";
import scroll from "/scroll.svg";
import space from "/space.svg";
import ekey from "/ekey.svg";
import qkey from "/qkey.svg";
import ctrl from "/ctrl.svg";
export function Helper() {
  return (
    <div className="flex flex-col absolute right-10 top-16 gap-2 items-end">
      <div className="flex gap-2 text-xs items-center">
        Drag Playfield
        <img src={middlemouse} />
      </div>
      <div className="flex gap-2 text-xs items-center">
        Seek Beatmap
        <img src={scroll} />
      </div>
      <div className="flex gap-2 text-xs items-center">
        Pause/Play
        <img src={space} />
      </div>

      <div className="flex gap-2 text-xs items-center">
        Path view
        <img src={qkey} />
        <img src={ekey} />
      </div>
      <div className="flex gap-2 text-xs items-center">
        Zoom
        <img src={ctrl} />
        <img src={scroll} />
      </div>
    </div>
  );
}
