import type { InstantByosRoom } from "./InstantByos";
import type { RoomSchemaShape } from "@instantdb/core";
import type { MaybeSignal, OnScopeDisposeFn } from "./types";

interface CursorSchema {
  x: number;
  y: number;
  xPercent: number;
  yPercent: number;
  color: string;
}

function getStyleString(styles: string[], important?: boolean) {
  return styles.join(important ? " important; " : "; ");
}

export function useCursors<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema
>(
  room: InstantByosRoom<any, RoomSchema, RoomType>,
  props: MaybeSignal<{
    spaceId?: string;
    propagate?: boolean;
    userCursorColor?: string;
    zIndex?: number;
  }> = {}
) {
  const defaultZ = 99999;

  const absStles = [
    "position: absolute",
    "top: 0",
    "left: 0",
    "bottom: 0",
    "right: 0",
  ];

  const inertStyles = [
    "overflow: hidden",
    "pointer-events: none",
    "user-select: none",
  ];

  const { _fn } = room;

  const spaceId = _fn.computed(
    () =>
      (_fn.toValue(props).spaceId ||
        `cursors-space-default--${String(room.type)}-${
          room.id.value
        }`) as keyof RoomSchema[RoomType]["presence"]
  );

  const spaceIdOld = _fn.signal(spaceId.value);

  const usePresenceOptions = _fn.computed(() => {
    return {
      keys: [spaceId.value],
    };
  });

  const cursorsPresence = room.usePresence(usePresenceOptions);

  const isLoadingFirst = _fn.signal(true);
  const stopIsLoadingFirst = _fn.effect(() => {
    if (!isLoadingFirst.value) {
      return;
    }
    isLoadingFirst.value = cursorsPresence.isLoading.value;
  });

  const fullPresence = room.usePresence();

  function getCursor(presence: (typeof cursorsPresence.peers.value)[string]) {
    return presence[spaceId.value] as Pick<
      RoomSchema[RoomType]["presence"],
      keyof RoomSchema[RoomType]["presence"]
    > &
      CursorSchema;
  }

  function publishCursor(
    rect: DOMRect,
    touch: { clientX: number; clientY: number }
  ) {
    const x = touch.clientX;
    const y = touch.clientY;
    const xPercent = ((x - rect.left) / rect.width) * 100;
    const yPercent = ((y - rect.top) / rect.height) * 100;

    if (cursorsPresence.isLoading.value) {
      return;
    }

    try {
      cursorsPresence.publishPresence({
        [spaceId.value]: {
          x,
          y,
          xPercent,
          yPercent,
          color: _fn.toValue(props).userCursorColor,
        },
      } as RoomSchema[RoomType]["presence"]);
    } catch (error) {
      console.error(error);
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (!_fn.toValue(props).propagate) {
      e.stopPropagation();
    }

    if (e.currentTarget instanceof Element) {
      const rect = e.currentTarget.getBoundingClientRect();
      publishCursor(rect, e);
    }
  }

  // note: using it on mouseleave event
  function onMouseOut(e: MouseEvent) {
    clearPresence(spaceId.value);
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return;
    }

    const touch = e.touches[0];

    if (touch.target instanceof Element) {
      if (!_fn.toValue(props).propagate) {
        e.stopPropagation();
      }
      const rect = touch.target.getBoundingClientRect();
      publishCursor(rect, touch);
    }
  }

  function onTouchEnd(e: TouchEvent) {
    clearPresence(spaceId.value);
  }

  function clearPresence(_spaceId: typeof spaceId.value) {
    if (isLoadingFirst.value) {
      return;
    }
    try {
      cursorsPresence.publishPresence({
        [_spaceId]: undefined,
      } as RoomSchema[RoomType]["presence"]);
    } catch (error) {
      console.error(error);
    }
  }

  const stopClearPresence = _fn.effect(() => {
    const oldValue = spaceIdOld.peek();
    if (spaceId.value !== oldValue) {
      clearPresence(oldValue);
    }
    spaceIdOld.value = spaceId.value;
  });

  function stop() {
    stopIsLoadingFirst();
    stopClearPresence();
    clearPresence(spaceId.value);
  }

  _fn.onScopeDispose?.(() => {
    stop();
  });

  return {
    spaceId,
    cursorsPresence,
    fullPresence,
    getCursor,
    onMouseMove,
    onMouseOut,
    onTouchMove,
    onTouchEnd,
    clearPresence,
    stop,
    getGlobalWrapperStyles(important?: boolean) {
      return getStyleString(["position:relative"], important);
    },
    getWrapperStyles(important?: boolean) {
      return getStyleString(
        [
          ...absStles,
          ...inertStyles,
          `z-index: ${
            _fn.toValue(props).zIndex !== undefined
              ? _fn.toValue(props).zIndex
              : defaultZ
          }`,
        ],
        important
      );
    },
    getCursorStyles(
      presence: (typeof cursorsPresence.peers.value)[number],
      important?: boolean
    ) {
      return getStyleString(
        [
          ...absStles,
          `transform: ${`translate(${getCursor(presence).xPercent}%, ${
            getCursor(presence).yPercent
          }%)`}`,
          "transformOrigin: 0 0",
          "transition: transform 100ms",
        ],
        important
      );
    },
  };
}
