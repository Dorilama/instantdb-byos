import { html, computed } from "uhtml/signal";
import { routes, useRoute } from "@/router";
import { chatRoomoom } from "@/db";
import { hideInstantDevTools } from "@/utils";

let hidden = false;

const presence = chatRoomoom.usePresence();

const { active, inputProps } = chatRoomoom.useTypingIndicator("typing");

const activeMap = computed(() =>
  Object.fromEntries(
    active.value.map((activePeer) => {
      return [activePeer.userId, activePeer];
    })
  )
);

const typingText = computed(() => {
  if (active.value.length === 0) {
    return "";
  }
  if (active.value.length === 1) {
    return `${active.value[0].userId} is typing...`;
  }
  if (active.value.length === 2) {
    return `${active.value[0].userId} and ${active.value[1].userId} are typing...`;
  }
  return `${active.value[0].userId} and ${
    active.value.length - 1
  } others are typing...`;
});

export default function () {
  const route = useRoute();

  const peers = Object.values(presence.peers.value).filter(
    (p) => p.userId && p.path == route.value.path
  );

  if (!hidden) {
    hidden = !!hideInstantDevTools();
  }

  return html`<div
    class="flex flex-col items-center pt-4 pb-8 px-2 gap-4 max-w-screen-lg m-auto"
  >
    <div
      class="flex gap-2 min-h-12"
      class=${[
        presence.isLoading.value ? "skeleton" : "",
        "flex gap-2 min-h-12",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      ${peers.map((peer) => {
        return html`<div class="avatar placeholder indicator">
          ${activeMap.value[peer.userId]
            ? html`<span
                class="indicator-item loading loading-dots loading-xs"
              ></span>`
            : ""}
          <div
            class=${[peers.length > 4 ? "w-8" : "w-12", "rounded-full border-4"]
              .filter(Boolean)
              .join(" ")}
            style=${`border-color: ${peer.color};`}
          >
            <span class="text-2xl"
              >${peer.userId.replace(/^Anon-/, "")[0]}</span
            >
          </div>
        </div>`;
      })}
    </div>
    <label class="form-control">
      <div class="label"></div>
      <textarea
        class="textarea textarea-bordered h-24"
        placeholder="Write something here..."
        @keydown=${inputProps.onKeyDown}
        @blur=${inputProps.onBlur}
      ></textarea>
      <div class="label min-h-8">
        ${typingText.value
          ? html`<span class="label-text-alt">${typingText.value}</span>`
          : ""}
      </div>
    </label>
  </div>`;
}
