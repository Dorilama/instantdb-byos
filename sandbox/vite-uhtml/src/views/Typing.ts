import { html, computed } from "uhtml/signal";
import { routes } from "@/router";

const src = computed(
  () => "/#" + routes.find((r) => r.name === "typingIframe")?.path
);

export default function () {
  return html`<div
    class="flex flex-col items-center pt-4 pb-8 px-2 gap-4 max-w-screen-lg m-auto"
  >
    <h1 class="text-4xl animate-tada">Typing indicator</h1>

    <div class="flex flex-wrap gap-8 justify-around pb-8">
      ${Array.from({ length: 2 }).map(() => {
        return html`<div
          class="card card-bordered border-4 overflow-hidden h-full"
        >
          ${src.value
            ? html`<iframe src=${src} class="h-64"></iframe>`
            : html`<div
                role="alert"
                class="alert alert-error rounded-lg rounded-tl-none rounded-tr-none"
              >
                <span
                  aria-hidden="true"
                  class="icon-[mdi--error-outline] text-2xl"
                ></span>

                <span>Error! typingIframe route is missing</span>
              </div>`}
        </div>`;
      })}
    </div>
  </div>`;
}
