import { Badge } from "@/interface/components/ui/badge";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/interface/components/ui/menubar";
import { OsuRenderer } from "@/osu/OsuRenderer";
import { state } from "@/utils";
export function Navbar() {
  const { tool } = state();
  return (
    <Menubar className="rounded-none border-x-0 border-t-0 flex justify-between px-4">
      <div className="flex gap-2">
        <div className="flex items-center gap-2">
          <h3 className="scroll-m-20 text-lg font-semibold tracking-tight">
            Assist Games
          </h3>
          <Badge variant="outline">Editor</Badge>
        </div>

        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => {
                state.setState({ openDialog: true });
              }}
            >
              Open <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>

            {OsuRenderer.beatmap && (
              <MenubarItem
                onClick={() => {
                  state.setState({ saveDialog: true });
                }}
              >
                Export <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
            )}

            <MenubarSeparator />
            <MenubarItem
              onClick={() => {
                state.setState({ aboutDialog: true });
              }}
            >
              About Dropout
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {OsuRenderer.beatmap && (
          <>
            {" "}
            <MenubarMenu>
              <MenubarTrigger>Tools</MenubarTrigger>
              <MenubarContent>
                <MenubarItem
                  onClick={() => {
                    state.setState({ tool: "cursor" });
                  }}
                >
                  Cursor <MenubarShortcut>C</MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    state.setState({ tool: "brush" });
                  }}
                >
                  Brush <MenubarShortcut>B</MenubarShortcut>
                </MenubarItem>
                {/* <MenubarItem
                  onClick={() => {
                    state.setState({ tool: "smoother" });
                  }}
                >
                  Smoother <MenubarShortcut>V</MenubarShortcut>
                </MenubarItem>
                */}
                <MenubarItem
                  onClick={() => {
                    state.setState({ tool: "advanced" });
                  }}
                >
                  Advanced <MenubarShortcut>M</MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    state.setState({ metadataEditorDialog: true });
                  }}
                >
                  Metadata Editor <MenubarShortcut>N</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Shortcuts</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Next Note <MenubarShortcut>⌘RightArrow</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Previous Note <MenubarShortcut>⌘LeftArrow</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Slow Forward <MenubarShortcut>RightArrow</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Slow Backward <MenubarShortcut>LeftArrow</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Slow Forward <MenubarShortcut>D</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Slow Backward <MenubarShortcut>A</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Draw Key 1<MenubarShortcut>Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Draw Key 2<MenubarShortcut>X</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Undo<MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Redo<MenubarShortcut>⌘X</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Increase Path Range<MenubarShortcut>E</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Decrease Path Range<MenubarShortcut>Q</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Mods</MenubarTrigger>
              <MenubarContent>
                <MenubarItem
                  onClick={() => {
                    // state.setState({ forceHR: true });
                  }}
                >
                  Apply Hardrock
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    // state.setState({ forceHR: false });
                  }}
                >
                  Remove Hardrock
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Analyzer</MenubarTrigger>
              <MenubarContent>
                <MenubarItem
                  onClick={() => {
                    state.setState({ dataAnalysisDialog: true });
                  }}
                >
                  gRDA
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </>
        )}
      </div>

      {/* {beatmap && (
        <div className="flex gap-4 items-center">
          {mods?.map((mod) => {
            return (
              <img
                src={`./mod_${mod.acronym.toLowerCase()}.png`}
                className="h-5"
              ></img>
            );
          })}
          <div className="flex flex-col items-end">
            <p className="text-xs opacity-75">Currently Editing</p>

            <p className="text-xs font-bold">
              {beatmap?.metadata.artist} - {beatmap?.metadata.title}
            </p>
          </div>
          <img
            src={`https://assets.ppy.sh/beatmaps/${beatmap?.metadata.beatmapSetId}/covers/cover.jpg?${beatmap?.metadata.beatmapId}`}
            alt=""
            width={90}
            className="rounded-sm"
          />
        </div>
      )} */}
    </Menubar>
  );
}
