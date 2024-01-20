import { Button } from "@/interface/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/interface/components/ui/dialog";
import { Badge } from "@/interface/components/ui/badge";
import { state } from "@/utils";
export function SaveDialog() {
  const { saveDialog } = state();
  return (
    <Dialog
      open={saveDialog}
      onOpenChange={(change) => {
        state.setState({ saveDialog: change });
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Export Replay <Badge variant={"outline"}>Development</Badge>
          </DialogTitle>
          <DialogDescription>Export your replay</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" disabled>
            Export as .dimu
          </Button>
          <Button type="submit" disabled>
            Export as .osr
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
