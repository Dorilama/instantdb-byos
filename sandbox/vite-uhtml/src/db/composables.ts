import { useDb } from "@/db";
import { useRoute, useRouter } from "@/router";
import type { RoomSchema } from "@/db";

export const fixedRandomColor =
  "#" + Math.floor(Math.random() * 16777215).toString(16);

export const anonUser = `Anon-${Math.random().toString(36).slice(2, 6)}`;

export function useUserPresenceValue() {
  const { db } = useDb();
  const route = useRoute();

  const { user } = db.useAuth();
  const userPresence = db._fn.computed<RoomSchema["chat"]["presence"]>(() => {
    return {
      userId: user.value?.id || anonUser,
      color: fixedRandomColor,
      path: route.value.path,
    };
  });

  return userPresence;
}

export function usePeerStats() {
  const { db, chatRoomoom } = useDb();
  const router = useRouter();
  const routes = router.filter(
    (r) =>
      //@ts-ignore
      r.meta.isNav === true
  );
  const home = routes.find((r) => r.path == "/") || {
    path: "/",
    meta: {} as Record<string, unknown>,
  };
  const { peers, user } = chatRoomoom.usePresence();

  const count = db._fn.computed<{
    byPath: Record<(typeof routes)[number]["path"], number>;
    notInHome: number;
    total: number;
  }>(() => {
    return Object.values(peers.value).reduce(
      (count, peer) => {
        if (
          routes.find(
            (r) =>
              //@ts-ignore
              r.meta.isNav && r.path === peer.path
          )
        ) {
          count.byPath[peer.path] = (count.byPath[peer.path] || 0) + 1;
          if (peer.path !== home.path) {
            count.notInHome += 1;
          }
          count.total += 1;
        }

        return count;
      },
      {
        byPath: {} as Record<(typeof routes)[number]["path"], number>,
        notInHome: 0,
        total: 0,
      }
    );
  });
  return { user, peers, home, routes, count };
}
