import p5 from "p5";
import "./style.css";
import "./globals.css";
import { p, setEnv } from "./utils";
import { Renderer } from "./renderer";
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./interface/components/theme-provider";
import { App } from "./interface/App";
import { Events, hookable } from "./hooks";
import "@/hooks/starter";

document.addEventListener("contextmenu", (event) => event.preventDefault());
const handleWheel = hookable(Events.mouseWheel);
window.addEventListener("wheel", handleWheel, { passive: false });
async function main() {
  new p5(async (p5Instance) => {
    setEnv(p5Instance as unknown as p5);

    // Functions that should be expanded into multiple events
    p.preload = hookable(Events.preload);
    p.setup = hookable(Events.setup);
    p.windowResized = hookable(Events.resize);
    p.draw = hookable(Events.draw);
    p.mousePressed = hookable(Events.mousePressed);
    p.mouseDragged = hookable(Events.mouseDragged);
  }, document.getElementById("app")!);
}

main();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
