import { html } from "uhtml/reactive";
import { useRoute, type ViewComponent } from "@/router";
import { useDb } from "@/db";

const View: ViewComponent = () => {
  const route = useRoute();
  const { _fn } = route.value;
  const count = _fn.signal(10);
  const { db } = useDb();
  const query = db.useQuery({ todos: {} });
  return () => html`<h1>
      hello ${route.value.meta.label} - ${route.value.lib}
    </h1>
    <button
      @click=${() => {
        count.value += 1;
      }}
    >
      ${count.value}
    </button>
    <p>${query.data.value?.todos.length || 0}</p>`;
};

export default View;
