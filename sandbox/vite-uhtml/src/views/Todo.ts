import { html, effect, signal, computed } from "uhtml/signal";
import { useRoute } from "@/router";
import { db, type Todo } from "@/db";
import { TodoForm, TodoList, TodoFooter } from "@/components/Todo";
import { type User } from "@dorilama/instantdb-byos";

const q = { todos: {} };
const query = signal(q);
const { isLoading, data, error, stop } = db.useQuery(query);
const alertError = {} as { current?: HTMLDivElement };

effect(() => {
  if (error.value) {
    alertError.current?.scrollIntoView();
  }
});

function toggle() {
  if (query.value) {
    //@ts-ignore
    query.value = null;
  } else {
    query.value = q;
  }
}

const once = {
  todos: signal<Todo[] | null>(null),
  error: signal<string | null>(null),
  isLoading: signal(false),
};

async function queryOnce() {
  if (once.isLoading.value) {
    return;
  }
  once.isLoading.value = true;
  once.error.value = null;
  try {
    const result = await db.queryOnce({ todos: {} });
    once.todos.value = result.data.todos;
  } catch (error) {
    if (error instanceof Error) {
      once.error.value = error.message || "unknown error";
    } else {
      once.error.value = "unknown error";
    }
    once.todos.value = null;
  }
  once.isLoading.value = false;
}

const queryOnceText = computed(() => {
  console.log(once.todos.value);
  if (once.error.value) {
    return `QueryOnce Error: ${once.error.value} Click to update`;
  }
  if (once.todos.value === null) {
    return `Use QueryOnce to get a static count of todos`;
  }
  return `QueryOnce: ${
    Object.values(once.todos.value).length
  } todos. Click to update`;
});

const userOnce = {
  user: signal<User | null>(null),
  error: signal<string | null>(null),
  isLoading: signal(false),
  firstLoad: signal(true),
};

async function getAuth() {
  if (userOnce.isLoading.value) {
    return;
  }
  userOnce.isLoading.value = true;
  userOnce.error.value = null;
  try {
    const result = await db.getAuth();
    userOnce.user.value = result;
  } catch (error) {
    if (error instanceof Error) {
      userOnce.error.value = error.message || "unknown error";
    } else {
      userOnce.error.value = "unknown error";
    }
    userOnce.user.value = null;
  }
  userOnce.isLoading.value = false;
  userOnce.firstLoad.value = false;
}

const userOnceText = computed(() => {
  if (userOnce.error.value) {
    return `GetAuth Error: ${userOnce.error.value} Click to update`;
  }
  if (userOnce.user.value === null) {
    if (userOnce.firstLoad.value) {
      return `Use GetAuth to get the static value of the user`;
    }
    return `Not logged in. Click to update.`;
  }
  return `User: ${
    userOnce.user.value.email || "missing email"
  }. Click to update`;
});

const connectionStatus = db.useConnectionStatus();

export default function () {
  const todos = data.value?.todos || [];
  return html`<div class="flex flex-col items-center pt-4 pb-8 px-2 gap-4">
    <h1 class="text-4xl">Todo</h1>
    <div class="card card-bordered rounded-lg bg-base-100 sm:min-w-96">
      ${TodoForm({ todos })}${TodoList({
    todos,
    isLoading: isLoading.value,
  })}${TodoFooter({ todos })}
      ${
        error.value
          ? html`<div
              signal=${alertError}
              role="alert"
              class="alert alert-error rounded-lg rounded-tl-none rounded-tr-none"
            >
              <span
                aria-hidden="true"
                class="icon-[mdi--error-outline] text-2xl"
              ></span>

              <span>Error! ${error.value.message || "unknown error."}</span>
            </div>`
          : ""
      }
    </div>
    <p class="text-l">
      Connection status:
      <span class="badge badge-primary badge-outline"
        >${connectionStatus.value}</span
      ></p>
      <button class="btn btn-outline" @click=${toggle}>
        ${query.value ? "Pause" : "Restore"} live update
      </button>
      <button class="btn btn-outline" @click=${stop}>
        Stop live update without recover
      </button>
      <button
        class=${[
          "btn btn-outline mt-4",
          once.isLoading.value && "skeleton",
          once.error.value && "btn-error",
        ]
          .filter(Boolean)
          .join(" ")}
        @click=${queryOnce}
        ?disabled=${once.isLoading.value}
      >
        ${queryOnceText.value}
      </button>
      <button
        class=${[
          "btn btn-outline mt-4",
          userOnce.isLoading.value && "skeleton",
          userOnce.error.value && "btn-error",
        ]
          .filter(Boolean)
          .join(" ")}
        @click=${getAuth}
        ?disabled=${userOnce.isLoading.value}
      >
        ${userOnceText.value}
      </button>
    </p>
  </div>`;
}
