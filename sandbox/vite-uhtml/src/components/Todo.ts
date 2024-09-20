import { html, signal, effect } from "uhtml/signal";
import {
  addTodo,
  toggleAll,
  willCheckAll,
  toggleDone,
  deleteTodo,
  deleteCompleted,
} from "@/db/todo";
import type { Todo } from "@/db";

const model = signal("");
function onSubmit(e: Event) {
  e.preventDefault();
  addTodo(model.value);
  model.value = "";
}
export function TodoForm({ todos }: { todos: Todo[] }) {
  const willCheck = willCheckAll(todos);
  return html`<div class="join">
    <button
      class="join-item btn btn-square btn-ghost text-2xl rounded-bl-none"
      @click=${() => toggleAll(todos)}
      aria-label="toggle all"
    >
      <span
        aria-hidden="true"
        class=${willCheck
          ? "icon-[mdi--checkbox-multiple-marked]"
          : "icon-[mdi--checkbox-multiple-blank-outline]"}
      ></span>
    </button>
    <form
      @submit=${onSubmit}
      class="form-control join-item w-full border-l border-base-200"
    >
      <input
        class="join-item input input-ghost w-full rounded-br-none"
        placeholder="What needs to be done?"
        type="text"
        value=${model.value}
        @change=${(e: Event) => {
          const target = e.target as HTMLInputElement;
          model.value = target.value;
        }}
      />
    </form>
  </div>`;
}

const checkboxRefs: Record<string, HTMLFormElement> = {};

export function TodoList({
  todos,
  isLoading,
}: {
  todos: Todo[];
  isLoading: boolean;
}) {
  // TODO!
  todos.forEach((todo) => {
    checkboxRefs[todo.id]?.reset();
  });

  const className = [
    isLoading && "skeleton min-h-10",
    "table border-t rounded-none",
  ]
    .filter(Boolean)
    .join(" ");
  return html`<table class=${className}>
    <tbody>
      ${todos.map((todo) => {
        return html`<tr class="flex justify-between">
          <td class="flex-none flex items-center">
            <form
              ref=${(el: HTMLFormElement) => {
                checkboxRefs[todo.id] = el;
              }}
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                ?checked=${todo.done}
                @change=${() => toggleDone(todo)}
              />
            </form>
          </td>

          <td class="flex-auto flex items-center">
            <span class=${todo.done ? "line-through" : "no-underline"}
              >${todo.text}</span
            >
          </td>
          <td>
            <button
              class="btn btn-ghost btn-square btn-sm text-xl"
              aria-label="delete"
              @click=${() => deleteTodo(todo)}
            >
              <span aria-hidden="true" class="icon-[mdi--bin-outline]"></span>
            </button>
          </td>
        </tr>`;
      })}
    </tbody>
  </table>`;
}

export function TodoFooter({ todos }: { todos: Todo[] }) {
  const remainingTodo = todos.filter((todo) => !todo.done).length;
  const className = [
    (todos.length == 0 || todos.length > 1) && "border-t",
    "flex justify-between items-center gap-8 p-2",
  ]
    .filter(Boolean)
    .join(" ");
  return html`<div class=${className}>
    <p class="text-sm leading-8">
      Remaining todos:
      <span class="font-mono border rounded-md p-1">
        ${remainingTodo < 100
          ? html`<span class="countdown"
              ><span style=${`--value: ${remainingTodo}`}></span
            ></span>`
          : html`<span>${remainingTodo}</span>`}
      </span>
    </p>
    <button class="btn btn-ghost btn-xs" @click=${() => deleteCompleted(todos)}>
      Delete Completed
    </button>
  </div>`;
}
