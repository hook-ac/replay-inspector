import { OsuRenderer } from "@/osu/OsuRenderer";
import { Card } from "../components/ui/card";
import { Slider } from "../components/ui/slider";
import { state } from "@/utils";
import { Button } from "../components/ui/button";
import { ArrowLeft, ArrowRight, PauseIcon, PlayIcon } from "lucide-react";

export function KeypressEditor() {
  const { beatmap, replay } = state();
  if (!beatmap || !replay) {
    return;
  }
  return (
    <Card className="absolute w-[95%] bottom-40 h-14 left-1/2 translate-x-[-50%] p-4 flex flex-col items-center gap-4">
      <div className=""></div>

    </Card>
  );
}
