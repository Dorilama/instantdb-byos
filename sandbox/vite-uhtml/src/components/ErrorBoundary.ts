import { Hole, html, signal } from "uhtml/signal";

export default function NaiveErrorBoundary(children?: () => Hole) {
  const error = signal();

  let c = null;
  try {
    c = html`${children?.()}`;
  } catch (err) {
    error.value = err;
  }
  return html`${error.value ? html`<div>${error.value.message}</div>` : c}`;
}
