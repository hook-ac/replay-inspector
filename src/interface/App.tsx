import { AboutDialog } from "./composites/about-dialog";
import { MetadataEditor } from "./composites/metadata-editor";
import { OpenDialog } from "./composites/open-dialog";
import { SaveDialog } from "./composites/save-dialog";
import { AnalysisSheet } from "./composites/analysis.-sheet";
import { Navbar } from "./composites/Menu";
import { SongSlider } from "./composites/song-slider";
import { KeypressEditor } from "./composites/keypress-editor";

export function App() {
  return (
    <>
      <Navbar />
      <MetadataEditor />
      <OpenDialog />
      <SaveDialog />
      <AboutDialog />
      <AnalysisSheet />
      {/* <KeypressEditor /> */}
      <SongSlider />
    </>
  );
}
