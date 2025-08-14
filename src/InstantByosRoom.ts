// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import { InstantCoreDatabase } from "@instantdb/core";
import type {
  PresenceOpts,
  PresenceResponse,
  RoomSchemaShape,
  InstantSchemaDef,
} from "@instantdb/core";
import type {
  Signal,
  Computed,
  MaybeSignal,
  SignalFunctions,
  OnScopeDisposeFn,
  Arrayable,
} from "./types";

import { useTimeout } from "./useTimeout";

export type PresenceHandle<
  PresenceShape,
  Keys extends keyof PresenceShape,
  State = PresenceResponse<PresenceShape, Keys>
> = { [K in keyof State]: Signal<State[K]> } & {
  publishPresence: (data?: Partial<PresenceShape>) => void;
  stop: () => void;
};

export type TypingIndicatorOpts = {
  timeout?: number | null;
  stopOnEnter?: boolean;
  // Perf opt - `active` will always be an empty array
  writeOnly?: boolean;
};

export type TypingIndicatorHandle<PresenceShape> = {
  active: Signal<PresenceShape[]>;
  setActive(active: boolean): void;
  inputProps: {
    onKeyDown: (e: KeyboardEvent) => void;
    onBlur: () => void;
  };
  stop: () => void;
};

export const defaultActivityStopTimeout = 1_000;

// ------
// #region Topics

/**
 * Listen for broadcasted events given a room and topic.
 *
 * @see https://instantdb.com/docs/presence-and-topics
 * @example
 *  const roomId = signal("");
 *  const room = db.room('chats', roomId);
 *  db.rooms.useTopicEffect(room, 'emoji', (message, peer) => {
 *    console.log(peer.name, 'sent', message);
 *  });
 */
function useTopicEffect<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
  TopicType extends keyof RoomSchema[RoomType]["topics"]
>(
  room: InstantByosRoom<any, RoomSchema, RoomType>,
  topic: MaybeSignal<Arrayable<TopicType>>,
  onEvent: Arrayable<
    (
      event: RoomSchema[RoomType]["topics"][TopicType],
      peer: RoomSchema[RoomType]["presence"],
      topic: TopicType
    ) => any
  >
): () => void {
  const cleanup: (() => void)[] = [];
  function unsubscribe() {
    cleanup.forEach((fn) => fn());
    cleanup.length = 0;
  }
  const stop = room._fn.effect(() => {
    const _topic = room._fn.toValue(topic);
    const id = room.id.value;
    const topicArray = Array.isArray(_topic) ? _topic : [_topic];
    const callbacks = Array.isArray(onEvent) ? onEvent : [onEvent];
    cleanup.push(
      ...topicArray.map((topicType) => {
        return room._core._reactor.subscribeTopic(
          id,
          topicType,
          (
            event: RoomSchema[RoomType]["topics"][TopicType],
            peer: RoomSchema[RoomType]["presence"]
          ) => {
            callbacks.forEach((cb) => {
              cb(event, peer, topicType);
            });
          }
        );
      })
    );
    return unsubscribe;
  });

  room._fn.onScopeDispose?.(() => {
    stop();
  });

  return stop;
}

/**
 * Broadcast an event to a room.
 *
 * @see https://instantdb.com/docs/presence-and-topics
 * @example
 *  const roomId = signal("");
 *  const room = db.room('chats', roomId);
 *  const publishTopic = db.rooms.usePublishTopic(room, "emoji");
 *
 *  function App() {
 *    return (
 *      <button onClick={() => publishTopic({ emoji: "🔥" })}>Send emoj</button>
 *    );
 *  }
 */
function usePublishTopic<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
  TopicType extends keyof RoomSchema[RoomType]["topics"]
>(
  room: InstantByosRoom<any, RoomSchema, RoomType>,
  topic: MaybeSignal<TopicType>,
  onScopeDispose?: OnScopeDisposeFn
): (data: RoomSchema[RoomType]["topics"][TopicType]) => void {
  const stopRoomWatch = room._fn.effect(() => {
    const id = room.id.value;
    const cleanup = room._core._reactor.joinRoom(id);
    return cleanup;
  });

  let publishTopic = (data: RoomSchema[RoomType]["topics"][TopicType]) => {};

  const stopTopicWatch = room._fn.effect(() => {
    const id = room.id.value;
    const type = room.type.value;
    const _topic = room._fn.toValue(topic);
    publishTopic = (data: RoomSchema[RoomType]["topics"][TopicType]) => {
      room._core._reactor.publishTopic({
        roomType: type,
        roomId: id,
        topic: _topic,
        data,
      });
    };
  });

  function cleanup() {
    stopRoomWatch();
    stopTopicWatch();
  }

  if (onScopeDispose) {
    onScopeDispose(cleanup);
  }

  room._fn.onScopeDispose?.(cleanup);

  return publishTopic;
}

// #endregion

// ---------
// #region Presence

/**
 * Listen for peer's presence data in a room, and publish the current user's presence.
 *
 * @see https://instantdb.com/docs/presence-and-topics
 * @example
 *  const roomId = signal("");
 *  const room = db.room('chats', roomId);
 *  const {
 *    peers,
 *    publishPresence
 *  } = db.rooms.usePresence(room, { keys: ["name", "avatar"] });
 */
function usePresence<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
  Keys extends keyof RoomSchema[RoomType]["presence"]
>(
  room: InstantByosRoom<any, RoomSchema, RoomType>,
  opts: MaybeSignal<PresenceOpts<RoomSchema[RoomType]["presence"], Keys>> = {}
): PresenceHandle<RoomSchema[RoomType]["presence"], Keys> {
  const getInitialState = (): PresenceResponse<
    RoomSchema[RoomType]["presence"],
    Keys
  > => {
    const presence = room._core._reactor.getPresence(
      room.type.value,
      room.id.value,
      room._fn.toValue(opts)
    ) ?? {
      peers: {},
      isLoading: true,
    };

    return {
      peers: presence.peers,
      isLoading: !!presence.isLoading,
      user: presence.user,
      error: presence.error,
    };
  };

  const state = {
    peers: room._fn.signal({}),
    isLoading: room._fn.signal(false),
    user: room._fn.signal(undefined),
    error: room._fn.signal(undefined),
  };

  const stop = room._fn.effect(() => {
    const id = room.id.value;
    const type = room.type.value;
    const _opts = room._fn.toValue(opts);

    Object.entries(getInitialState()).forEach(([key, value]) => {
      state[
        key as keyof PresenceResponse<RoomSchema[RoomType]["presence"], Keys>
      ].value = value;
    });

    // @instantdb/core v0.14.30 removes types for subscribePresence
    // trying to restore types until fixed in core
    // by adding type to parameter in callback
    const unsubscribe = room._core._reactor.subscribePresence(
      type,
      id,
      _opts,
      (data: PresenceResponse<RoomSchema[RoomType]["presence"], Keys>) => {
        Object.entries(data).forEach(([key, value]) => {
          state[
            key as keyof PresenceResponse<
              RoomSchema[RoomType]["presence"],
              Keys
            >
          ].value = value;
        });
      }
    );
    return unsubscribe;
  });

  room._fn.onScopeDispose?.(() => {
    stop();
  });

  return {
    ...state,
    publishPresence: (data) => {
      room._core._reactor.publishPresence(room.type.value, room.id.value, data);
    },
    stop,
  };
}

/**
 * Publishes presence data to a room
 *
 * @see https://instantdb.com/docs/presence-and-topics
 * @example
 *  const roomId = signal("");
 *  const room = db.room('chats', roomId);
 *  db.rooms.useSyncPresence(room, { name, avatar, color });
 */
function useSyncPresence<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema
>(
  room: InstantByosRoom<any, RoomSchema, RoomType>,
  data: MaybeSignal<Partial<RoomSchema[RoomType]["presence"] | undefined>>,
  deps?: MaybeSignal<any[]>
): () => void {
  const stopJoinRoom = room._fn.effect(() => {
    const id = room.id.value;
    const _data = room._fn.toValue(data);
    const cleanup = room._core._reactor.joinRoom(id, _data);
    return cleanup;
  });

  const stopPublishPresence = room._fn.effect(() => {
    const id = room.id.value;
    const type = room.type.value;
    const _data = room._fn.toValue(data);
    room._fn.toValue(deps);
    room._core._reactor.publishPresence(type, id, _data);
  });

  function stop() {
    stopJoinRoom();
    stopPublishPresence();
  }

  room._fn.onScopeDispose?.(() => {
    stop();
  });

  return stop;
}

// #endregion

// -----------------
// #region Typing Indicator

/**
 * Manage typing indicator state
 *
 * @see https://instantdb.com/docs/presence-and-topics
 * @example
 *  const roomId = signal("");
 *  const room = db.room('chats', roomId);
 *  const {
 *    active,
 *    setActive,
 *    inputProps,
 *  } = db.rooms.useTypingIndicator(room, "chat-input");
 *
 *  function App() {
 *    return (
 *      <input onBlur="inputProps.onBlur" onKeydown="inputProps.onKeyDown"/>
 *    );
 *  }
 */
function useTypingIndicator<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema
>(
  room: InstantByosRoom<any, RoomSchema, RoomType>,
  inputName: MaybeSignal<string>,
  opts: MaybeSignal<TypingIndicatorOpts> = {}
): TypingIndicatorHandle<RoomSchema[RoomType]["presence"]> {
  const timeout = useTimeout({ onScopeDispose: room._fn.onScopeDispose });

  const _inputName = room._fn.toValue(inputName);

  const onservedPresence = rooms.usePresence(
    room,
    //@ts-ignore TODO! same error in InstantReact
    () => ({
      keys: [room._fn.toValue(inputName)],
    })
  );

  const active = room._fn.computed(() => {
    const presenceSnapshot = room._core._reactor.getPresence(
      room.type.value,
      room.id.value
    );
    onservedPresence.peers.value;

    return room._fn.toValue(opts)?.writeOnly
      ? []
      : Object.values(presenceSnapshot?.peers ?? {}).filter(
          //@ts-ignore TODO! same error in InstantReact
          (p) => p[_inputName] === true
        );
  });

  const setActive = (isActive: boolean) => {
    const _opts = room._fn.toValue(opts);
    const _inputName = room._fn.toValue(inputName);
    const id = room.id.value;
    const type = room.type.value;
    room._core._reactor.publishPresence(type, id, {
      [_inputName]: isActive,
    } as unknown as Partial<RoomSchema[RoomType]>);

    if (!isActive) return;

    if (_opts?.timeout === null || _opts?.timeout === 0) return;

    timeout.set(_opts?.timeout ?? defaultActivityStopTimeout, () => {
      room._core._reactor.publishPresence(type, id, {
        [_inputName]: null,
      } as Partial<RoomSchema[RoomType]>);
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const _opts = room._fn.toValue(opts);
    const isEnter = _opts?.stopOnEnter && e.key === "Enter";
    const isActive = !isEnter;

    setActive(isActive);
  };

  function stop() {
    timeout.clear();
  }

  room._fn.onScopeDispose?.(() => {
    stop();
  });

  return {
    active,
    setActive,
    inputProps: {
      onKeyDown,
      onBlur: () => {
        setActive(false);
      },
    },
    stop,
  };
}

// #endregion

// --------------
// #region Hooks
export const rooms = {
  useTopicEffect,
  usePublishTopic,
  usePresence,
  useSyncPresence,
  useTypingIndicator,
};

// #endregion

// ------------
// #region Class

export class InstantByosRoom<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema
> {
  _core: InstantCoreDatabase<Schema, boolean>;
  type: Computed<RoomType>;
  id: Computed<string>;
  _fn: SignalFunctions;

  constructor(
    _core: InstantCoreDatabase<Schema, boolean>,
    type: Computed<RoomType>,
    id: Computed<string>,
    signalFunctions: SignalFunctions
  ) {
    this._core = _core;

    this._fn = signalFunctions;
    this.type = type;
    this.id = id;
  }

  /**
   * @deprecated
   * `db.room(...).useTopicEffect` is deprecated. You can replace it with `db.rooms.useTopicEffect`.
   *
   * @example
   *
   * // Before
   * const room = db.room('chat', 'room-id');
   * room.useTopicEffect('emoji', (message, peer) => {  });
   *
   * // After
   * const room = db.room('chat', 'room-id');
   * db.rooms.useTopicEffect(room, 'emoji', (message, peer) => {  });
   */
  useTopicEffect = <TopicType extends keyof RoomSchema[RoomType]["topics"]>(
    topic: MaybeSignal<Arrayable<TopicType>>,
    onEvent: Arrayable<
      (
        event: RoomSchema[RoomType]["topics"][TopicType],
        peer: RoomSchema[RoomType]["presence"],
        topic: TopicType
      ) => any
    >
  ): (() => void) => {
    return rooms.useTopicEffect(this, topic, onEvent);
  };

  /**
   * @deprecated
   * `db.room(...).usePublishTopic` is deprecated. You can replace it with `db.rooms.usePublishTopic`.
   *
   * @example
   *
   * // Before
   * const room = db.room('chat', 'room-id');
   * const publish = room.usePublishTopic('emoji');
   *
   * // After
   * const room = db.room('chat', 'room-id');
   * const publish = db.rooms.usePublishTopic(room, 'emoji');
   */
  usePublishTopic = <Topic extends keyof RoomSchema[RoomType]["topics"]>(
    topic: MaybeSignal<Topic>,
    onScopeDispose?: OnScopeDisposeFn
  ): ((data: RoomSchema[RoomType]["topics"][Topic]) => void) => {
    return rooms.usePublishTopic(this, topic);
  };

  /**
   * @deprecated
   * `db.room(...).usePresence` is deprecated. You can replace it with `db.rooms.usePresence`.
   *
   * @example
   *
   * // Before
   * const room = db.room('chat', 'room-id');
   * const { peers } = room.usePresence({ keys: ["name", "avatar"] });
   *
   * // After
   * const room = db.room('chat', 'room-id');
   * const { peers } = db.rooms.usePresence(room, { keys: ["name", "avatar"] });
   */
  usePresence = <Keys extends keyof RoomSchema[RoomType]["presence"]>(
    opts: MaybeSignal<PresenceOpts<RoomSchema[RoomType]["presence"], Keys>> = {}
  ): PresenceHandle<RoomSchema[RoomType]["presence"], Keys> => {
    return rooms.usePresence(this, opts);
  };

  /**
   * @deprecated
   * `db.room(...).useSyncPresence` is deprecated. You can replace it with `db.rooms.useSyncPresence`.
   *
   * @example
   *
   * // Before
   * const room = db.room('chat', 'room-id');
   * room.useSyncPresence(room, { nickname });
   *
   * // After
   * const room = db.room('chat', 'room-id');
   * db.rooms.useSyncPresence(room, { nickname });
   */
  useSyncPresence = (
    data: MaybeSignal<Partial<RoomSchema[RoomType]["presence"] | undefined>>,
    deps?: MaybeSignal<any[]>
  ): (() => void) => {
    return rooms.useSyncPresence(this, data, deps);
  };

  /**
   * @deprecated
   * `db.room(...).useTypingIndicator` is deprecated. You can replace it with `db.rooms.useTypingIndicator`.
   *
   * @example
   *
   * // Before
   * const room = db.room('chat', 'room-id');
   * const typing = room.useTypingIndiactor(room, 'chat-input');
   *
   * // After
   * const room = db.room('chat', 'room-id');
   * const typing = db.rooms.useTypingIndiactor(room, 'chat-input');
   */
  useTypingIndicator = (
    inputName: MaybeSignal<string>,
    opts: MaybeSignal<TypingIndicatorOpts> = {}
  ): TypingIndicatorHandle<RoomSchema[RoomType]["presence"]> => {
    return rooms.useTypingIndicator(this, inputName, opts);
  };
}

// #endregion
