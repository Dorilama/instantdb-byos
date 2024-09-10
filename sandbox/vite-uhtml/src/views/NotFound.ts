import { html } from "uhtml/signal";
import { useRoute } from "@/router";

export default function () {
  const route = useRoute();
  return html`<h1>${route.value.meta.label}</h1>`;
}
