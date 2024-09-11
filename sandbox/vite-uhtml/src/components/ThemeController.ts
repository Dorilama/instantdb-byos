import { html } from "uhtml/signal";
import { settings } from "@/utils";

function toggle() {
  if (settings.value.theme === "light") {
    settings.value = { ...settings.value, theme: "dark" };
  } else {
    settings.value = { ...settings.value, theme: "light" };
  }
}

export default function () {
  return html`<label class="swap swap-rotate">
    <input
      type="checkbox"
      value=${settings.value.theme}
      @change=${toggle}
      ?checked=${settings.value.theme !== "dark"}
    />

    <div
      class="swap-on h-10 w-10 fill-current icon-[mdi--white-balance-sunny]"
    ></div>

    <div
      class="swap-off h-10 w-10 fill-current icon-[mdi--moon-and-stars]"
    ></div>
  </label>`;
}
