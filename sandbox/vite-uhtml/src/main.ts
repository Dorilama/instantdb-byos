import "./style.css";
import { html, detach } from "uhtml/reactive";
import { useRoute, RouteView } from "./router";
import { effect } from "@webreflection/signal";
import BottomNav from "@/components/BottomNav";

const route = useRoute();

const root = document.getElementById("app")!;

const sample = () => {
  const route = useRoute();
  const { _fn } = route.value;
  const count = _fn.signal(0);
  console.log("sample@1");

  const View = RouteView();

  // return () => {
  //   console.log("sample@2");
  return html`<p>${route.value.lib}</p>
    <button
      @click=${() => {
        count.value += 1;
        console.log(count.value);
      }}
    >
      ${count.value}
    </button>
    <ul>
      ${["w", "u", "p"].map(
        (s) => html`<li><a href=${"#" + s}>go to ${s}</a></li>`
      )}
    </ul>
    <br />${View()}`;
  // };
};

const App = () => {
  const r = useRoute();
  const View = r.value.component();
  const BN = BottomNav();
  return () => html`<p>hello</p>
    ${View()}${BN()}`;
};

effect(() => {
  const el = route.value.render(root, App());
  const lib = route.value.lib;
  const cleanup = route.value.cleanup;
  return () => {
    if (lib === route.value.lib) {
      return;
    }
    console.log("detach", lib, route.value.lib);
    cleanup();
    detach(el);
  };
});
