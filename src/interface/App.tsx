import { Toaster } from "sonner";
import { AboutDialog } from "./composites/about-dialog";
import { MetadataEditor } from "./composites/metadata-editor";
import { OpenDialog } from "./composites/open-dialog";
import { SaveDialog } from "./composites/save-dialog";
import { AnalysisSheet } from "./composites/analysis.-sheet";
import { Navbar } from "./composites/Menu";

export function App() {
  return (
    <>
      <Navbar />
      <MetadataEditor />
      <OpenDialog />
      <SaveDialog />
      <AboutDialog />
      <Toaster />
      <AnalysisSheet />
    </>
  );
}
