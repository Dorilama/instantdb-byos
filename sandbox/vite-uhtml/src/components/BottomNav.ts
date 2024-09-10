import { html } from "uhtml/reactive";
import { useRoute, type ViewComponent, RouterLink } from "@/router";
import { useDb } from "@/db";
import { usePeerStats } from "@/db/composables";

const View = () => {
  const route = useRoute();
  const { _fn } = route.value;
  const { db } = useDb();
  const { isLoading, user, error } = db.useAuth();
  const { user: myPresence, home, routes, count } = usePeerStats();

  const control = {} as { current?: HTMLDialogElement };

  const Home = RouterLink({
    to: home.path,
    children: html`<span class="btm-nav-label indicator"
      ><span class="p-1 px-4">Todo</span>${count.value.byPath[home.path]
        ? html`<span
            class="badge badge-accent indicator-item indicator-start sm:indicator-top sm:indicator-end"
            >${count.value.byPath[home.path]}</span
          >`
        : ""}</span
    >`,
  });

  return () => html`<div class="btm-nav btm-nav-sm lg:hidden border-t">
    ${""}
    ${
      /*<button @click=${() => control.current?.showModal()}>
      <span class="btm-nav-label indicator"
        ><span class="p-1 px-4">Menu</span>${count.value.total
          ? html`<span
              class="badge badge-accent indicator-item indicator-start sm:indicator-top sm:indicator-end"
              >${count.value.total}</span
            >`
          : ""}</span
      >
    </button>*/ ""
    }
    ${
      /*isLoading.value
      ? html`<button class="rounded-none skeleton" disabled></button>`
      : user.value
      ? html`<button
          class="rounded-none w-1/3 sm:w-auto"
          @click=${() => db.auth.signOut()}
        >
          <span class="btm-nav-label flex flex-col items-center w-full">
            <span
              class="badge w-full sm:w-fit"
              style=${{ borderColor: myPresence?.value?.color }}
              ><span class="overflow-hidden">{{ user.email }}</span></span
            >
            <span>Sign out</span></span
          >
        </button>`
      : RouterLink({
          to: "/signin",
          class: "rounded-none font-bold",
          children: html` <span class="btm-nav-label">Sign in</span>`,
        })()*/ ""
    }
  </div>`;
};

export default View;
