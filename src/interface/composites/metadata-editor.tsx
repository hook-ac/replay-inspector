import { Button } from "@/interface/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/interface/components/ui/dialog";
import { Input } from "@/interface/components/ui/input";
import { Label } from "@/interface/components/ui/label";
import { Badge } from "@/interface/components/ui/badge";
import { RefObject, useState } from "react";
import { state } from "@/utils";
import { toast } from "sonner";

export function MetadataEditor() {
  const { metadataEditorDialog, beatmap } = state();
  const [newOd, setNewOd] = useState(0);
  const [newAr, setNewAr] = useState(0);
  const [newCs, setNewCs] = useState(0);

  // useEffect(() => {
  //   setNewOd(Math.round(state.getState().difficulty.OD * 10) / 10);
  //   setNewAr(Math.round(state.getState().difficulty.AR * 10) / 10);
  //   setNewCs(Math.round(state.getState().difficulty.CS * 10) / 10);
  // }, [metadataEditorDialog, difficulty]);

  if (!beatmap) {
    if (metadataEditorDialog) {
      state.setState({ metadataEditorDialog: false });
      toast("Load a replay first", {
        description: "Can't open metadata editor",
      });
    }

    return <></>;
  }

  return (
    <Dialog
      open={metadataEditorDialog}
      onOpenChange={(change) => {
        state.setState({ metadataEditorDialog: change });
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <form
          onSubmit={(event) => {
            event?.preventDefault();
            // state.setState((state) => ({
            //   difficulty: { CS: newCs, AR: newAr, OD: newOd },
            // }));
            // toast(
            //   {
            //     title: "Metadata updated",
            //     description: "Metadata has been updated",
            //   },
            //   1500
            // );
            // changeMetadata(newCs, newAr, newOd, frame);
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit metadata</DialogTitle>
            <DialogDescription>
              Make changes to the replay here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ar" className="text-right">
                Approach Rate
              </Label>
              <Input
                id="ar"
                type="number"
                defaultValue={newAr}
                min={0}
                step={0.01}
                max={12}
                onChange={(e) => {
                  setNewAr(Number(e.target.value));
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="od" className="text-right">
                Overall Difficulty
              </Label>
              <Input
                id="od"
                type="number"
                min={0}
                max={12}
                step={0.01}
                defaultValue={newOd}
                onChange={(e) => {
                  setNewOd(Number(e.target.value));
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cs" className="text-right">
                Circle Size
              </Label>
              <Input
                id="cs"
                type="number"
                min={0}
                step={0.01}
                max={12}
                defaultValue={newCs}
                onChange={(e) => {
                  setNewCs(Number(e.target.value));
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
