// Icons: Tabler outline set, inlined as SVG so they follow the text colour and
// work offline. One family for the whole app.

import arrowLeft from "@tabler/icons/outline/arrow-left.svg?raw";
import check from "@tabler/icons/outline/check.svg?raw";
import chevronRight from "@tabler/icons/outline/chevron-right.svg?raw";
import externalLink from "@tabler/icons/outline/external-link.svg?raw";
import moodKid from "@tabler/icons/outline/mood-kid.svg?raw";
import moon from "@tabler/icons/outline/moon.svg?raw";
import info from "@tabler/icons/outline/info-circle.svg?raw";
import layoutRight from "@tabler/icons/outline/layout-sidebar-right.svg?raw";
import layoutBottom from "@tabler/icons/outline/layout-bottombar.svg?raw";
import sun from "@tabler/icons/outline/sun.svg?raw";
import cube from "@tabler/icons/outline/cube.svg?raw";
import rotate from "@tabler/icons/outline/rotate-clockwise-2.svg?raw";
import zoomIn from "@tabler/icons/outline/zoom-in.svg?raw";
import zoomOut from "@tabler/icons/outline/zoom-out.svg?raw";
import focusCentered from "@tabler/icons/outline/focus-centered.svg?raw";
import refresh from "@tabler/icons/outline/refresh.svg?raw";
import school from "@tabler/icons/outline/school.svg?raw";
import alertTriangle from "@tabler/icons/outline/alert-triangle.svg?raw";
import stepOver from "@tabler/icons/outline/arrow-bounce.svg?raw";
import book from "@tabler/icons/outline/book-2.svg?raw";
import bug from "@tabler/icons/outline/bug.svg?raw";
import bulb from "@tabler/icons/outline/bulb.svg?raw";
import code from "@tabler/icons/outline/code.svg?raw";
import copy from "@tabler/icons/outline/copy.svg?raw";
import database from "@tabler/icons/outline/database.svg?raw";
import databaseOff from "@tabler/icons/outline/database-off.svg?raw";
import download from "@tabler/icons/outline/download.svg?raw";
import eraser from "@tabler/icons/outline/eraser.svg?raw";
import fileZip from "@tabler/icons/outline/file-zip.svg?raw";
import settings from "@tabler/icons/outline/settings.svg?raw";
import upload from "@tabler/icons/outline/upload.svg?raw";
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
  arrowLeft,
  book,
  bug,
  bulb,
  check,
  chevronRight,
  code,
  copy,
  database,
  databaseOff,
  download,
  eraser,
  externalLink,
  fileZip,
  moodKid,
  moon,
  info,
  layoutRight,
  layoutBottom,
  sun,
  cube,
  rotate,
  zoomIn,
  zoomOut,
  focusCentered,
  refresh,
  school,
  settings,
  upload,
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
