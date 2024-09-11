import { html } from "uhtml/signal";
import { RouterLink } from "@/router";
import { db } from "@/db";
import { usePeerStats } from "@/db/composables";
import ThemeController from "./ThemeController";

const { isLoading, user, error } = db.useAuth();
const { user: myPresence, home, routes, count } = usePeerStats();

const View = () => {
  return html`
    <header class="navbar hidden lg:flex border-b">
      <div class="navbar-start">
        <ul class="menu menu-horizontal px-1">
          <li>
            ${RouterLink({
              to: home.path,
              attr: { class: "indicator" },
              children: html`${home.meta.label || "Home"}${count.value.byPath[
                home.path
              ]
                ? html`<span class="badge badge-accent indicator-item"
                    >${count.value.byPath[home.path]}</span
                  >`
                : ""}`,
            })}
          </li>
          ${routes.map((r) => {
            return r !== home
              ? html`<li>
                  ${RouterLink({
                    to: r.path,
                    attr: {
                      class: "indicator",
                    },
                    children: html`${r.meta.label ?? r.path}${count.value
                      .byPath[r.path]
                      ? html`<span class="badge badge-accent indicator-item"
                          >${count.value.byPath[r.path]}</span
                        >`
                      : ""}`,
                  })}
                </li>`
              : html``;
          })}
        </ul>
      </div>
      <div class="navbar-end gap-4">
        ${ThemeController()}
        ${isLoading.value
          ? html`<button class="btn skeleton" disabled>
              <span class="opacity-0" aria-hidden="true">Sign in</span>
            </button>`
          : user.value
          ? html` <span
                class="badge"
                style=${`border-color: ${myPresence?.value?.color};`}
                >${user.value.email}</span
              >
              <button class="btn" @click=${() => db.auth.signOut()}>
                <span class="btm-nav-label">Sign out</span>
              </button>`
          : RouterLink({
              to: "/signin",
              attr: { class: "btn font-bold" },
              children: html` <span class="btm-nav-label">Sign in</span>`,
            })}
      </div>
    </header>
  `;
};

export default View;
