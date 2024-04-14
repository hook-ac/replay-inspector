import { Button } from "@/interface/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/interface/components/ui/dialog";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { scoreEncoder, state } from "@/utils";
import { useState } from "react";
export function SaveDialog() {
  const { saveDialog } = state();
  const [isLoading, setIsLoading] = useState(false)
  return (
    <Dialog
      open={saveDialog}
      onOpenChange={(change) => {
        state.setState({ saveDialog: change });
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Replay</DialogTitle>
          <DialogDescription>Export your replay</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" disabled={isLoading} onClick={async () => {
            setIsLoading(true)
            const buffer = await scoreEncoder.encodeToBuffer(OsuRenderer.replay, OsuRenderer.beatmap)

            var blob = new Blob([buffer], { type: "application/pdf" });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            var fileName = `${OsuRenderer.replay.replay?.hashMD5}.osr`;
            link.download = fileName;
            link.click();
            setIsLoading(false)
          }}>
            {isLoading ? "Exporting..." : `Export as .osr`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
