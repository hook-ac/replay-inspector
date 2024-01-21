import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/interface/components/ui/sheet";
import { Button } from "@/interface/components/ui/button";
import { BarChart, XAxis, Bar, ResponsiveContainer } from "recharts";
import { state } from "@/utils";
import { gRDA } from "@/osu/Analysis";
import { OsuRenderer } from "@/osu/OsuRenderer";

export function AnalysisSheet() {
  const { dataAnalysisDialog, grda } = state();

  return (
    <Sheet
      open={dataAnalysisDialog}
      onOpenChange={(opened: boolean) => {
        state.setState({ dataAnalysisDialog: opened });
      }}
    >
      <SheetContent
        side="left"
        className="min-w-[600px] overflow-scroll overflow-x-hidden SCROLL"
      >
        <SheetHeader>
          <SheetTitle>gRDA</SheetTitle>
          <SheetDescription>
            Most of the information provided here is forensic and can be used to
            detect specific types of cheats, such as Timewarp and Relax. This
            process might take up to a minute to do and collect all information.
          </SheetDescription>
        </SheetHeader>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            state.setState({
              grda: gRDA(OsuRenderer.replay, OsuRenderer.beatmap),
            });
          }}
        >
          Analyze Replay
        </Button>
        {grda && (
          <div>
            <h3 className="text-xl font-semibold tracking-tight flex items-center gap-3 mt-6">
              <span>Response</span>
            </h3>
            <div className="opacity-75">
              <h3 className="text-sm">Frametime Averages:</h3>
              <ResponsiveContainer height={200} width="100%">
                <BarChart height={200} data={Object.entries(grda.frameTimes)}>
                  <XAxis dataKey="0" />
                  <Bar dataKey="1" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>

              <div>Normalization rate due to mods {grda.normalizationRate}</div>
              <ResponsiveContainer height={200} width="100%">
                <BarChart
                  height={200}
                  data={Object.entries(grda.moddedFrameTimes)}
                >
                  <XAxis dataKey="0" />
                  <Bar dataKey="1" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="opacity-75">
              <h3 className="text-sm">Averages:</h3>
              <div>
                Slider Delta Hold Average{" "}
                {Math.round(
                  (grda.sliderDeltaHoldAverage / grda.sliderLength) * 100
                ) / 100}
              </div>
              <div>
                Approximated circle hold delta range ={" "}
                {grda.circleExtremes.max - grda.circleExtremes.min}
              </div>
              <div>
                Approximated slider hold delta range ={" "}
                {grda.sliderExtremes.max - grda.sliderExtremes.min}
              </div>
            </div>

            <div>Circle | Holdtime distribution</div>
            <ResponsiveContainer height={400} width="100%">
              <BarChart
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                height={400}
                data={Object.entries(grda.holdCircleDistributionGraph)}
              >
                <XAxis dataKey="0" />
                <Bar dataKey="1" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

            <div>Circle | Press time distribution</div>
            <ResponsiveContainer height={400} width="100%">
              <BarChart
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                height={400}
                data={Object.entries(grda.pressCircleDistributionGraph).sort(
                  (a, b) => Number(a[0]) - Number(b[0])
                )}
              >
                <XAxis dataKey="0" />
                <Bar dataKey="1" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
