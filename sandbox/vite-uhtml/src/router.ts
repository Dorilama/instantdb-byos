import type {
  ToValueFn,
  SignalFunctions,
  ComputedFn,
  OnScopeDisposeFn,
} from "@dorilama/instantdb-byos";
import { signal, computed, effect } from "@webreflection/signal";
import { Hole, reactive, html } from "uhtml/reactive";
import {
  signal as wsignal,
  computed as wcomputed,
  effect as weffect,
  Signal as wSignal,
} from "@webreflection/signal";
import {
  signal as usignal,
  computed as ucomputed,
  effect as ueffect,
  Signal as uSignal,
} from "usignal";
import {
  signal as psignal,
  computed as pcomputed,
  effect as peffect,
  Signal as pSignal,
} from "@preact/signals";

export type ViewComponent<T = any> = (props?: T) => () => Hole;

const modules = import.meta.glob("@/views/*.ts", { eager: true }) as Record<
  string,
  { default: ViewComponent }
>;

const wtoValue: typeof ToValueFn = (v) => {
  if (v instanceof wSignal) {
    return v.value;
  }
  return v;
};

const utoValue: typeof ToValueFn = (v) => {
  if (v instanceof uSignal) {
    return v.valueOf();
  }
  return v;
};

const ptoValue: typeof ToValueFn = (v) => {
  if (v instanceof pSignal) {
    return v.value;
  }
  return v;
};

const wCleanArr = [] as (() => void)[];
const uCleanArr = [] as (() => void)[];
const pCleanArr = [] as (() => void)[];

function cleanup(arr: (() => void)[]) {
  arr.forEach((fn) => {
    fn();
  });
  arr.length = 0;
}

export const wClean = () => {
  cleanup(wCleanArr);
};
export const uClean = () => {
  cleanup(uCleanArr);
};
export const pClean = () => {
  cleanup(pCleanArr);
};

const wOnscopeDispose: OnScopeDisposeFn = (cb) => {
  wCleanArr.push(cb);
};
const uOnscopeDispose: OnScopeDisposeFn = (cb) => {
  uCleanArr.push(cb);
};
const pOnscopeDispose: OnScopeDisposeFn = (cb) => {
  pCleanArr.push(cb);
};

const wrender = reactive(weffect);
const urender = reactive(ueffect);
const prender = reactive(peffect);

const wfn = {
  signal: wsignal,
  computed: wcomputed,
  effect: weffect,
  toValue: wtoValue,
  onScopeDispose: wOnscopeDispose,
};

const ufn = {
  signal: usignal,
  computed: ucomputed as typeof ComputedFn,
  effect: ueffect,
  toValue: utoValue,
  onScopeDispose: uOnscopeDispose,
};

const pfn = {
  signal: psignal,
  computed: pcomputed,
  effect: peffect,
  toValue: ptoValue,
  onScopeDispose: pOnscopeDispose,
};

const notFound = {
  path: "/404",
  name: "notFound",
  component: modules["/src/views/NotFound.ts"].default,
  meta: { label: "Not Found" },
};

const routes = [
  {
    path: "/",
    name: "home",
    component: modules["/src/views/Todo.ts"].default,
    meta: { label: "Todo", isNav: true },
  },
  {
    path: "/signin",
    name: "signin",
    component: modules["/src/views/Signin.ts"].default,
    meta: { label: "Sign in" },
  },
  {
    path: "/cursors",
    name: "cursors",
    component: modules["/src/views/Cursors.ts"].default,
    meta: { label: "Cursors", isNav: true },
  },
  {
    path: "/typing",
    name: "typing",
    component: modules["/src/views/Typing.ts"].default,
    meta: { label: "Typing", isNav: true },
  },
  {
    path: "/topics",
    name: "topics",
    component: modules["/src/views/Topics.ts"].default,
    meta: { label: "Topics", isNav: true },
  },
  notFound,
] as const;

function parse(hash: string) {
  let [lib, path = ""] = hash.slice(1).split("/");

  if (!["w", "u", "p"].includes(lib)) {
    lib = "w";
  }
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  return { lib, path };
}

const currentPath = signal(parse(window.location.hash));

window.addEventListener("hashchange", () => {
  currentPath.value = parse(window.location.hash);
});

const currentView = computed(() => {
  const path = currentPath.value.path;
  const lib = currentPath.value.lib;
  const route = routes.find((r) => r.path == path) || notFound;
  const _fn = lib === "u" ? ufn : lib === "p" ? pfn : wfn;
  const render = lib === "u" ? urender : lib === "p" ? prender : wrender;
  const cleanup = lib === "u" ? uClean : lib === "p" ? pClean : wClean;
  return { ...route, lib, _fn, render, cleanup };
});

export function useRouter() {
  return routes;
}

export function useRoute() {
  return currentView;
}

export const RouteView: ViewComponent = () => {
  const r = useRoute();
  const View = r.value.component();
  return View;
};

export const RouterLink = (props: {
  to: (typeof routes)[number]["path"];
  children?: Hole;
  class?: string;
}) => {
  const r = useRoute();
  const { children, to } = props || {};
  const isActive = r.value._fn.computed(() => r.value.path === to);
  console.log(r.value.path, to);
  return () => html`<a
    href=${`/${r.value.lib}${to.startsWith("/") ? to : "/" + to}`}
    class=${(props?.class || "") + isActive.value ? "active" : ""}
    >${children}</a
  >`;
};
