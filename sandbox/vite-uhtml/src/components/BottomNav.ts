import { html } from "uhtml/signal";
import { RouterLink } from "@/router";
import { db } from "@/db";
import { usePeerStats } from "@/db/composables";

const { isLoading, user, error } = db.useAuth();
const { user: myPresence, home, routes, count } = usePeerStats();

const View = () => {
  const control = {} as { current?: HTMLDialogElement };

  return html`<div class="btm-nav btm-nav-sm lg:hidden border-t">
      ${RouterLink({
        to: home.path,
        children: html`<span class="btm-nav-label indicator"
          ><span class="p-1 px-4">Todo</span>${count.value.byPath[home.path]
            ? html`<span
                class="badge badge-accent indicator-item indicator-start sm:indicator-top sm:indicator-end"
                >${count.value.byPath[home.path]}</span
              >`
            : ""}</span
        >`,
      })}

      <button @click=${() => control.current?.showModal()}>
        <span class="btm-nav-label indicator"
          ><span class="p-1 px-4">Menu</span>${count.value.total
            ? html`<span
                class="badge badge-accent indicator-item indicator-start sm:indicator-top sm:indicator-end"
                >${count.value.total}</span
              >`
            : ""}</span
        >
      </button>

      ${isLoading.value
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
                ><span class="overflow-hidden">${user.value.email}</span></span
              >
              <span>Sign out</span></span
            >
          </button>`
        : RouterLink({
            to: "/signin",
            attr: { class: "rounded-none font-bold" },
            children: html` <span class="btm-nav-label">Sign in</span>`,
          })}
    </div>

    <dialog ref=${control} class="modal modal-bottom sm:modal-middle">
      <div class="modal-box">
        <span class="text-md">Menu</span>
        <ul class="menu bg-base-100 rounded-box p-2">
          ${routes.map((r) => {
            return html`<li>
              ${RouterLink({
                to: r.path,
                attr: {
                  onClick() {
                    control.current?.close();
                  },
                },
                children: html`${r.meta.label ?? r.path}${count.value.byPath[
                  r.path
                ]
                  ? html`<span class="badge badge-accent"
                      >${count.value.byPath[r.path]}</span
                    >`
                  : ""}`,
              })}
            </li>`;
          })}
        </ul>
        ${/*TODO! themecontroller*/ ""}

        <div class="modal-action sm:hidden">
          <form method="dialog">
            <button class="btn">Close</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>`;
};

export default View;
