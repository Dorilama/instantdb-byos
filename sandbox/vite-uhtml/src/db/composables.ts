import { computed } from "uhtml/signal";
import { useRoute, routes as _routes } from "@/router";
import { db, chatRoom } from "@/db";

export const fixedRandomColor =
  "#" + Math.floor(Math.random() * 16777215).toString(16);

export const anonUser = `Anon-${Math.random().toString(36).slice(2, 6)}`;

export function useUserPresenceValue() {
  const route = useRoute();

  const { user } = db.useAuth();

  const userPresence = computed(() => {
    return {
      userId: user.value?.id || anonUser,
      color: fixedRandomColor,
      path: route.value.path,
    };
  });

  return userPresence;
}

export function usePeerStats() {
  const routes = _routes.filter(
    (r) =>
      //@ts-ignore
      r.meta.isNav === true
  );
  const home = routes.find((r) => r.path == "/") || {
    path: "/",
    meta: {} as Record<string, unknown>,
  };
  const { peers, user } = chatRoom.usePresence();

  const count = computed<{
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
