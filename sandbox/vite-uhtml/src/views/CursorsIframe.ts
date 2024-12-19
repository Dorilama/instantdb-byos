import { html, computed } from "uhtml/signal";
import { parseUrl } from "@/router";
import { chatRoom } from "@/db";
import { hideInstantDevTools } from "@/utils";
import Cursors from "@/components/Cursors";

let hidden = false;

const { query } = parseUrl();
const spaceId = query.spaceid;
const color = query.color;
const custom = query.custom;

const cursorOptions = computed(() => {
  return {
    spaceId,
    userCursorColor: color ? "#" + color : "",
    propagate: true,
  };
});

function scroll(allow: boolean) {
  if (allow) {
    window.parent.document.body.classList.remove("block-scroll");
  } else {
    window.parent.document.body.classList.add("block-scroll");
  }
}

function CustomCursor(props: { color: string }) {
  return html`<div
    class="badge"
    style=${[color && `background-color: ${"#" + color};`]
      .filter(Boolean)
      .join("; ")}
  >
    ${custom}
  </div>`;
}

function Main() {
  return html`<p>Move your cursor around! ✨</p>`;
}

const CS = Cursors(cursorOptions, Main, {
  class: "w-screen h-screen flex items-center justify-center",
  onTouchMove: () => {
    scroll(false);
  },
  onTouchEnd: () => {
    scroll(true);
  },
});

export default function () {
  if (!hidden) {
    hidden = !!hideInstantDevTools();
  }

  return CS(custom ? CustomCursor : undefined);
}
