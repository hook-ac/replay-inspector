import { OsuRenderer } from "@/osu/OsuRenderer";
import { Card } from "../components/ui/card";
import { Slider } from "../components/ui/slider";
import { state } from "@/utils";
import { Button } from "../components/ui/button";
import { ArrowLeft, ArrowRight, PauseIcon, PlayIcon } from "lucide-react";

export function SongSlider() {
  const { beatmap, replay, playing, time } = state();
  if (!beatmap || !replay) {
    return;
  }
  return (
    <Card className="absolute w-[95%] bottom-10 left-1/2 translate-x-[-50%] p-4 flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-start w-full ">
          <p className="text-sm opacity-50">Current time</p>
          <p>{new Date(time).toISOString().slice(11, 19)}</p>
        </div>
        <div className="flex gap-2 w-full justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              OsuRenderer.setTime(OsuRenderer.time - 1000);
            }}
          >
            <ArrowLeft />
          </Button>
          <Button
            onClick={() => {
              OsuRenderer.setPlaying(!playing);
            }}
            variant="outline"
            size="icon"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              OsuRenderer.setTime(OsuRenderer.time + 1000);
            }}
          >
            <ArrowRight />
          </Button>
        </div>
        <div className="flex w-full justify-end"></div>
      </div>

      <div className="relative w-full">
        <Slider
          step={10}
          min={0}
          max={replay.replay?.length}
          value={[time]}
          onValueChange={(value: any) => {
            OsuRenderer.setTime(value[0]);
          }}
        />
        <canvas
          className="absolute w-full h-full top-0 pointer-events-none"
          height={8}
          width={"1000"}
          id="timelineCanvas"
        ></canvas>
      </div>
    </Card>
  );
}
