import { signal, effect, Signal } from "uhtml/signal";

export function hideInstantDevTools() {
  const el = document.body.lastElementChild as HTMLElement;
  const app = document.getElementById("app");
  if (app && el && !app.contains(el)) {
    el.style.display = "none";
    return true;
  }
}

const defaultTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "ligh";

let _settings = { theme: defaultTheme };
try {
  _settings = JSON.parse(window.localStorage.getItem("settings") || "{}");
  if (!_settings.theme) {
    _settings.theme = defaultTheme;
  }
} catch (error) {
  console.log(error);
}

export const settings = signal(_settings);

effect(() => {
  window.localStorage.setItem("settings", JSON.stringify(settings.value));
  document.documentElement.dataset.theme = settings.value.theme;
});
