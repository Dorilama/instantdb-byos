import "./style.css";
import { render, html, signal, effect } from "uhtml/signal";

const count = signal(0);

const root = document.querySelector<HTMLDivElement>("#app")!;
render(
  root,
  () => html`
    <h1>Hello</h1>
    <button
      @click=${() => {
        count.value += 1;
      }}
    >
      ${count.value}
    </button>
  `
);
