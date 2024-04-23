import { Tooling } from "@/hooks/tooling";
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
import { BrushTool } from "@/tooling/brush";
import { state } from "@/utils";
export function Navbar() {
  const { beatmap, mods } = state();
  return (
    <Menubar className="rounded-none border-x-0 border-t-0 flex justify-between px-4">
      <div className="flex gap-2">
        <div className="flex items-center gap-2">
          <h3 className="scroll-m-20 text-lg font-semibold tracking-tight">
            Replay Inspector
          </h3>
          <Badge
            variant={"outline"}
            className="px-2 cursor-pointer"
            onClick={() => {
              document.location.href = "https://hook.ac";
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 111 111"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M109.183 37.1922L110.953 27.2815C111.278 25.4591 109.877 23.7857 108.026 23.7857H89.4905L93.1136 3.49576C93.4389 1.67342 92.0378 0 90.1867 0H80.1194C79.4215 1.26775e-05 78.7459 0.245536 78.2108 0.693579C77.6757 1.14162 77.3152 1.76362 77.1926 2.45067L73.3826 23.7857H48.9441L52.5672 3.49576C52.8927 1.67342 51.4916 0 49.6403 0H39.573C38.8751 1.26775e-05 38.1994 0.245536 37.6643 0.693579C37.1292 1.14162 36.7688 1.76362 36.6461 2.45067L32.8362 23.7857H13.2388C12.5408 23.7857 11.8652 24.0313 11.3301 24.4793C10.795 24.9273 10.4345 25.5493 10.3119 26.2364L8.54207 36.1471C8.21675 37.9694 9.61788 39.6429 11.4689 39.6429H30.0045L24.3412 71.3571H4.74379C4.04588 71.3572 3.37021 71.6027 2.83511 72.0507C2.3 72.4988 1.93957 73.1208 1.81691 73.8078L0.0471032 83.7185C-0.278216 85.5409 1.12291 87.2143 2.97398 87.2143H21.5095L17.8864 107.504C17.5611 109.327 18.9622 111 20.8133 111H30.8806C31.5785 111 32.2541 110.754 32.7892 110.306C33.3243 109.858 33.6848 109.236 33.8074 108.549L37.6176 87.2143H62.0559L58.4328 107.504C58.1073 109.327 59.5084 111 61.3597 111H71.427C72.1249 111 72.8006 110.754 73.3357 110.306C73.8708 109.858 74.2312 109.236 74.3539 108.549L78.1638 87.2143H97.7613C98.4592 87.2143 99.1348 86.9687 99.6699 86.5207C100.205 86.0727 100.565 85.4507 100.688 84.7636L102.458 74.8529C102.783 73.0306 101.382 71.3571 99.5311 71.3571H80.9956L86.6588 39.6429H106.256C106.954 39.6428 107.63 39.3973 108.165 38.9493C108.7 38.5012 109.06 37.8792 109.183 37.1922ZM64.8877 71.3571H40.4494L46.1126 39.6429H70.5509L64.8877 71.3571Z"
                fill="#EEEEEE"
              />
            </svg>
          </Badge>
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
              About Inspector
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
                    Tooling.currentTool = undefined;
                  }}
                >
                  Cursor <MenubarShortcut>1</MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    Tooling.currentTool = new BrushTool();
                  }}
                >
                  Brush <MenubarShortcut>2</MenubarShortcut>
                </MenubarItem>
                {/* <MenubarItem
                  onClick={() => {
                    state.setState({ tool: "smoother" });
                  }}
                >
                  Smoother <MenubarShortcut>V</MenubarShortcut>
                </MenubarItem>
                */}
                {/* <MenubarItem
                  onClick={() => {
                    state.setState({ tool: "advanced" });
                  }}
                >
                  Advanced <MenubarShortcut>M</MenubarShortcut>
                </MenubarItem> */}
                <MenubarItem
                  onClick={() => {
                    state.setState({ metadataEditorDialog: true });
                  }}
                >
                  Metadata Editor <MenubarShortcut>N</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            {/* <MenubarMenu>
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
            </MenubarMenu> */}
            <MenubarMenu>
              <MenubarTrigger>Mods</MenubarTrigger>
              <MenubarContent>
                <MenubarItem
                  onClick={() => {
                    OsuRenderer.forceHR = true;
                    OsuRenderer.refreshMetadata();
                  }}
                >
                  Apply Hardrock
                </MenubarItem>
                <MenubarItem
                  onClick={() => {
                    OsuRenderer.forceHR = false;
                    OsuRenderer.refreshMetadata();
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

      {beatmap && (
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
      )}
    </Menubar>
  );
}
