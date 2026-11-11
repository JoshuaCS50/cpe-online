// Icons: Tabler outline set, inlined as SVG so they follow the text colour and
// work offline. One family for the whole app.

import alertTriangle from "@tabler/icons/outline/alert-triangle.svg?raw";
import stepOver from "@tabler/icons/outline/arrow-bounce.svg?raw";
import bug from "@tabler/icons/outline/bug.svg?raw";
import code from "@tabler/icons/outline/code.svg?raw";
import copy from "@tabler/icons/outline/copy.svg?raw";
import database from "@tabler/icons/outline/database.svg?raw";
import databaseOff from "@tabler/icons/outline/database-off.svg?raw";
import eraser from "@tabler/icons/outline/eraser.svg?raw";
import fileCode from "@tabler/icons/outline/file-code.svg?raw";
import files from "@tabler/icons/outline/files.svg?raw";
import pencil from "@tabler/icons/outline/pencil.svg?raw";
import play from "@tabler/icons/outline/player-play.svg?raw";
import resume from "@tabler/icons/outline/player-skip-forward.svg?raw";
import stop from "@tabler/icons/outline/player-stop.svg?raw";
import plus from "@tabler/icons/outline/plus.svg?raw";
import stepInto from "@tabler/icons/outline/step-into.svg?raw";
import stepOut from "@tabler/icons/outline/step-out.svg?raw";
import terminal from "@tabler/icons/outline/terminal-2.svg?raw";
import trash from "@tabler/icons/outline/trash.svg?raw";
import wifi from "@tabler/icons/outline/wifi.svg?raw";
import wifiOff from "@tabler/icons/outline/wifi-off.svg?raw";
import x from "@tabler/icons/outline/x.svg?raw";

const ICONS = {
  alertTriangle,
  bug,
  code,
  copy,
  database,
  databaseOff,
  eraser,
  fileCode,
  files,
  pencil,
  play,
  plus,
  resume,
  stepInto,
  stepOut,
  stepOver,
  stop,
  terminal,
  trash,
  wifi,
  wifiOff,
  x,
} as const;

export type IconName = keyof typeof ICONS;

/** A decorative icon element. Give the surrounding control its own label. */
export function icon(name: IconName): HTMLSpanElement {
  const wrapper = document.createElement("span");
  wrapper.className = "icon";
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.innerHTML = ICONS[name];
  return wrapper;
}
