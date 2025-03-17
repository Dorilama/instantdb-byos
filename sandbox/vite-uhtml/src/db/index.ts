import {
  init,
  type ToValueFn,
  type InstaQLParams,
  type InstaQLResult,
} from "@dorilama/instantdb-byos";
import { signal, computed, effect, Signal } from "uhtml/signal";

import schema from "../../instant.schema";

const toValue: typeof ToValueFn = (v) => {
  if (v instanceof Signal) {
    return v.value;
  }
  return v;
};

// Visit https://instantdb.com/dash to get your APP_ID :)
const APP_ID = import.meta.env["VITE_INSTANT_APP_ID"];

export const db = init(
  { appId: APP_ID, schema },
  { signal, computed, effect, toValue }
);
export const chatRoom = db.room("chat", "dev");

const todosQuery = { todos: {} } satisfies InstaQLParams<typeof schema>;

type TodosResult = InstaQLResult<typeof schema, typeof todosQuery>;

export type Todo = TodosResult["todos"][number];
db.rooms.usePublishTopic(chatRoom);
