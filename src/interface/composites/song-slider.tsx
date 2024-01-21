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
    <Card className="absolute w-[95%] bottom-5 left-1/2 translate-x-[-50%] p-4 flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <Button variant="outline" size="icon">
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
        <Button variant="outline" size="icon">
          <ArrowRight />
        </Button>
      </div>

      <Slider
        step={10}
        min={0}
        max={replay.replay?.length}
        value={[time]}
        onValueChange={(value: any) => {
          OsuRenderer.setTime(value[0]);
        }}
      />
    </Card>
  );
}
