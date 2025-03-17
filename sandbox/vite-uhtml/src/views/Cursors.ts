import { html, computed } from "uhtml/signal";
import { routes } from "@/router";
import { chatRoom, db } from "@/db";

const { user } = db.rooms.usePresence(chatRoom);

const src = computed(
  () => "/#" + routes.find((r) => r.name === "cursorsIframe")?.path
);

const spaceId = computed(() => {
  return user?.value?.userId || "";
});

const color = computed(() => {
  return user?.value?.color?.replace("#", "") || "000";
});

function makeSrc(id: string, color: string, custom?: string) {
  return `${src}?spaceid=${spaceId.value}-${id}&color=${color}${
    custom ? `&custom=${custom}` : ""
  }`;
}

export default function () {
  return html`<div
    class="flex flex-col items-center pt-4 pb-8 px-2 gap-4 max-w-screen-lg m-auto"
  >
    <h1 class="text-4xl">Cursors</h1>
    <h2 class="self-start text-2xl">Default cursor</h2>

    <div class="flex flex-wrap gap-8 justify-around pb-8">
      ${Array.from({ length: 2 }).map((_, n) => {
        return html`<div
          class="card card-bordered border-4 overflow-hidden h-full"
        >
          ${src.value
            ? html`<iframe
                src=${makeSrc("r1", n == 1 ? "f5a442" : color.value)}
                class="h-64"
              ></iframe>`
            : html`<div
                role="alert"
                class="alert alert-error rounded-lg rounded-tl-none rounded-tr-none"
              >
                <span
                  aria-hidden="true"
                  class="icon-[mdi--error-outline] text-2xl"
                ></span>

                <span>Error! cursorsIframe route is missing</span>
              </div>`}
        </div>`;
      })}
    </div>

    <h2 class="self-start text-2xl">Custom cursor</h2>

    <div class="flex flex-wrap gap-8 justify-around pb-8">
      ${Array.from({ length: 2 }).map((_, n) => {
        return html`<div
          class="card card-bordered border-4 overflow-hidden h-full"
        >
          ${src.value
            ? html`<iframe
                src=${makeSrc(
                  "r2",
                  n == 1 ? "f5a442" : color.value,
                  "hello-world"
                )}
                class="h-64"
              ></iframe>`
            : html`<div
                role="alert"
                class="alert alert-error rounded-lg rounded-tl-none rounded-tr-none"
              >
                <span
                  aria-hidden="true"
                  class="icon-[mdi--error-outline] text-2xl"
                ></span>

                <span>Error! cursorsIframe route is missing</span>
              </div>`}
        </div>`;
      })}
    </div>
  </div>`;
}
