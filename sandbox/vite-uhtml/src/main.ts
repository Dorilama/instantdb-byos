import "./style.css";
import {
  render,
  html,
  signal,
  effect,
  computed,
  Signal,
  Computed,
} from "uhtml/signal";
import { init } from "@dorilama/instantdb-byos";
import type { ToValueFn } from "@dorilama/instantdb-byos";
import { Signal as PSignal, signal as psignal } from "@preact/signals";

console.log(psignal() instanceof PSignal);

const count = signal(0);

const APP_ID = import.meta.env["VITE_INSTANT_APP_ID"];

// Optional: Declare your schema for intellisense!
export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export type Schema = {
  todos: Todo;
};

export type RoomSchema = {
  chat: {
    presence: {
      userId: string;
      color: string;
      path: string;
    };
    topics: {
      emoji: { text: string; color?: string };
    };
  };
};

const toValue: typeof ToValueFn = (value) => {
  if (value instanceof Signal) {
    return value.value;
  }
  return value;
};

export const db = init<Schema, RoomSchema>(
  { appId: APP_ID },
  { signal, computed, effect, toValue, onScopeDispose: () => {} }
);
export const chatRoomoom = db.room("chat", "dev");

const query = db.useQuery({ todos: {} });

const presence = chatRoomoom.usePresence();

effect(() => {
  console.log(query.data.value);
});
effect(() => {
  console.log(presence.peers.value);
});

const root = document.querySelector<HTMLDivElement>("#app")!;
render(
  root,
  () => html`
    <h1>Hello</h1>
    <button
      @click=${() => {
        count.value += 1;
      }}
    >
      ${count.value}
    </button>
  `
);
