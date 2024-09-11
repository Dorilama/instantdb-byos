import { html, effect } from "uhtml/signal";
import { useRoute } from "@/router";
import { db, chatRoomoom } from "@/db";
import { TodoForm, TodoList, TodoFooter } from "@/components/Todo";

const { isLoading, data, error } = db.useQuery({ todos: {} });
const alertError = {} as { current?: HTMLDivElement };

effect(() => {
  if (error.value) {
    alertError.current?.scrollIntoView();
  }
});

export default function () {
  const todos = data.value?.todos || [];
  return html`<div class="flex flex-col items-center pt-4 pb-8 px-2 gap-4">
    <h1 class="text-4xl">Todo</h1>
    <div class="card card-bordered rounded-lg bg-base-100 sm:min-w-96">
      ${TodoForm({ todos })}${TodoList({
        todos,
        isLoading: isLoading.value,
      })}${TodoFooter({ todos })}
      ${error.value
        ? html`<div
            ref=${alertError}
            role="alert"
            class="alert alert-error rounded-lg rounded-tl-none rounded-tr-none"
          >
            <span
              aria-hidden="true"
              class="icon-[mdi--error-outline] text-2xl"
            ></span>

            <span>Error! ${error.value.message || "unknown error."}</span>
          </div>`
        : ""}
    </div>
  </div>`;
}
