import { html } from "uhtml/signal";
import { hideInstantDevTools } from "@/utils";
import { chatRoom, db } from "@/db";

let hidden = false;

const { user } = db.rooms.usePresence(chatRoom);
const publishTopic = db.rooms.usePublishTopic(chatRoom, "emoji");

export default function () {
  if (!hidden) {
    hidden = !!hideInstantDevTools();
  }

  const emoji = {
    fire: "🔥",
    wave: "👋",
    confetti: "🎉",
    heart: "❤️",
  } as const;

  const emojiRefs: {
    [K in keyof typeof emoji]: { current?: HTMLElement };
  } = {
    fire: {},
    wave: {},
    confetti: {},
    heart: {},
  };

  chatRoom.useTopicEffect("emoji", (event, peer, topic) => {
    const el = emojiRefs[event.text as keyof typeof emoji];
    if (!el.current) {
      return;
    }
    el.current.classList.add("animate-tada", "btn-primary", "bg-primary");
    if (event.color) {
      el.current.style.backgroundColor = event.color;
      el.current.style.borderColor = event.color;
    }
    setTimeout(() => {
      if (!el.current) {
        return;
      }
      el.current.classList.remove("animate-tada", "btn-primary", "bg-primary");
      el.current.style.backgroundColor = "";
      el.current.style.borderColor = "";
    }, 1000);
  });

  return html`<div
    class="flex flex-col items-center pt-4 pb-8 px-2 gap-4 max-w-screen-lg m-auto"
  >
    <ul class="flex gap-2">
      ${Object.entries(emoji).map(([name, text]) => {
        return html`<li>
          <button
            class="btn btn-outline text-xl"
            @click=${() => {
              publishTopic({ text: name, color: user?.value?.color });
            }}
            ref=${
              //@ts-ignore
              emojiRefs[name]
            }
          >
            ${text}
          </button>
        </li>`;
      })}
    </ul>
    <p>Click a button! ✨</p>
  </div>`;
}
