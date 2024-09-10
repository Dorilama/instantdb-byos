import { html } from "uhtml/reactive";
import { useRoute, type ViewComponent } from "@/router";

const View: ViewComponent = () => {
  const route = useRoute();
  const { _fn } = route.value;
  const count = _fn.signal(10);
  console.log(count, _fn.signal);
  return () => html`<h1>
      hello ${route.value.meta.label} - ${route.value.lib}
    </h1>
    <button
      @click=${() => {
        count.value += 1;
        console.log(count.value);
      }}
    >
      ${count.value}
    </button>`;
};

export default View;
