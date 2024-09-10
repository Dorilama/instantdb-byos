import { tx, id } from "@dorilama/instantdb-byos";
import type { Todo } from "@/db";
import { useDb } from "@/db";

export function addTodo(text: string) {
  if (!text) {
    return;
  }
  const { db } = useDb();
  db.transact(
    tx.todos[id()].update({
      text,
      done: false,
      createdAt: Date.now(),
    })
  );
}

export function toggleAll(todos: Todo[] = []) {
  const { db } = useDb();
  const newVal = todos.some((todo) => !todo.done);
  db.transact(todos.map((todo) => tx.todos[todo.id].update({ done: newVal })));
}

export function willCheckAll(todos: Todo[] = []) {
  return todos.some((todo) => !todo.done);
}

export function deleteCompleted(todos: Todo[]) {
  const { db } = useDb();
  const completed = todos.filter((todo) => todo.done);
  const txs = completed.map((todo) => tx.todos[todo.id].delete());
  db.transact(txs);
}

export function toggleDone(todo: Todo) {
  const { db } = useDb();
  db.transact(tx.todos[todo.id].update({ done: !todo.done }));
}

export function deleteTodo(todo: Todo) {
  const { db } = useDb();
  db.transact(tx.todos[todo.id].delete());
}
