import { Hole, html, signal, computed } from "uhtml/signal";

export type ViewComponent<T = any> = (props?: T) => Hole;

const modules = import.meta.glob("@/views/*.ts", { eager: true }) as Record<
  string,
  { default: ViewComponent }
>;

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

const currentPath = signal(window.location.hash.slice(1) || "/");

window.addEventListener("hashchange", () => {
  currentPath.value = window.location.hash.slice(1) || "/";
});

const currentView = computed(() => {
  const path = currentPath.value;
  const route = routes.find((r) => r.path == path) || notFound;
  return { ...route };
});

export function useRouter() {
  return routes;
}

export function useRoute() {
  return currentView;
}

export const RouteView: ViewComponent = () => {
  const r = useRoute();
  return r.value.component();
};

export const RouterLink = (props: {
  to: (typeof routes)[number]["path"];
  children?: Hole;
  attr?: Record<string, unknown>;
}) => {
  const r = useRoute();
  const { children, to } = props || {};
  const isActive = r.value.path === to;
  const hash = `#${to.startsWith("/") ? to : "/" + to}`;
  const className = [props.attr?.class, isActive ? "active" : ""]
    .filter(Boolean)
    .join(" ");

  return html`<a
    href=${"/" + hash}
    class=${className}
    @click=${(e: Event) => {
      e.preventDefault();
      window.location.hash = hash;
      if (props.attr?.onClick && typeof props.attr.onClick === "function") {
        props.attr.onClick();
      }
    }}
    >${children}</a
  >`;
};
