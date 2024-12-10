import {
  init,
  type ToValueFn,
  OnScopeDisposeFn,
} from "@dorilama/instantdb-byos";
import { signal, computed, effect, Signal } from "uhtml/signal";

const toValue: typeof ToValueFn = (v) => {
  if (v instanceof Signal) {
    return v.value;
  }
  return v;
};

// Visit https://instantdb.com/dash to get your APP_ID :)
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

export const db = init<Schema, RoomSchema>(
  { appId: APP_ID },
  { signal, computed, effect, toValue }
);
export const chatRoomoom = db.room("chat", "dev");
