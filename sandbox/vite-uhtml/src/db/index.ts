import { useRoute } from "@/router";
import { init } from "@dorilama/instantdb-byos";

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

export function useDb() {
  const route = useRoute();
  const db = init<Schema, RoomSchema>({ appId: APP_ID }, route.value._fn);
  const chatRoomoom = db.room("chat", "dev");
  route.value._fn.onScopeDispose(() => {
    console.log("shutdown");
    db._core.shutdown();
  });
  return { db, chatRoomoom };
}
