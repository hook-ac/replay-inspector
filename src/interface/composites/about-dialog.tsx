import { Button } from "@/interface/components/ui/button";
import { Dialog, DialogContent } from "@/interface/components/ui/dialog";
import { Badge } from "@/interface/components/ui/badge";
import { state } from "@/utils";
export function AboutDialog() {
  const { aboutDialog } = state();
  return (
    <Dialog
      open={aboutDialog}
      onOpenChange={(change: any) => {
        state.setState({ aboutDialog: change });
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <img src="icon.png" alt="dpr" />
        <div className="bottom-0 left-0 ">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight flex items-center gap-3">
            osu! editor <Badge variant="outline">your mum</Badge>
          </h3>
          <div className="opacity-75">
            <h3 className="text-sm">stop fucking bothering me</h3>
          </div>

          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              window.open("https://github.com/cunev");
            }}
          >
            GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
