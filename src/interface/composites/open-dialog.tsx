import { Button } from "@/interface/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/interface/components/ui/dialog";
import { UploadIcon } from "lucide-react";
import Dropzone from "react-dropzone";
import { state } from "@/utils";
export function OpenDialog() {
  const { openDialog } = state();
  return (
    <Dialog
      open={openDialog}
      onOpenChange={(change: any) => {
        state.setState({ openDialog: change });
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Open Replay</DialogTitle>
          <DialogDescription>Upload your replay</DialogDescription>
        </DialogHeader>

        <Button
          variant="outline"
          onClick={() => {
            // sendReplay(frame);
            state.setState({ openDialog: false });
          }}
        >
          Open Demo Replay
        </Button>

        <Dropzone
          onDrop={(acceptedFiles) => {
            const reader = new FileReader();
            const file = acceptedFiles[0];
            reader.readAsArrayBuffer(file);
            reader.onload = function (event: any) {
              const buffer = event.target.result;
              // sendReplay(frame, buffer);
              state.setState({ openDialog: false });
            };
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <div
              {...getRootProps()}
              className="w-full border-dashed border-2 p-4 rounded-md cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <input {...getInputProps()} />
              <UploadIcon />
            </div>
          )}
        </Dropzone>
      </DialogContent>
    </Dialog>
  );
}
