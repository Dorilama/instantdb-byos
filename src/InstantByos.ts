// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import {
  InstantClient,
  Auth,
  Storage,
  txInit,
  _init_internal,
} from "@instantdb/core";
import type {
  AuthState,
  Config,
  Query,
  Exactly,
  TransactionChunk,
  // LifecycleSubscriptionState,
  PresenceOpts,
  PresenceResponse,
  RoomSchemaShape,
  InstaQLQueryParams,
  ConfigWithSchema,
  IDatabase,
  InstantGraph,
  QueryResponse,
  PageInfoResponse,
} from "@instantdb/core";
import { useQuery } from "./useQuery";
import type { UseQueryReturn } from "./useQuery";
import type { Signal, Computed, MaybeSignal, SignalFunctions } from "./types";

import { useTimeout } from "./useTimeout";

type UseAuthReturn = { [K in keyof AuthState]: Signal<AuthState[K]> };

export type PresenceHandle<
  PresenceShape,
  Keys extends keyof PresenceShape,
  State = PresenceResponse<PresenceShape, Keys>
> = { [K in keyof State]: Signal<State[K]> } & {
  publishPresence: (data: Partial<PresenceShape>) => void;
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

type Arrayable<T> = T[] | T;

export const defaultActivityStopTimeout = 1_000;

export class InstantByosRoom<
  Schema extends InstantGraph<any, any> | {},
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema
> {
  _core: InstantClient<Schema, RoomSchema>;
  type: Computed<RoomType>;
  id: Computed<string>;
  _fn: SignalFunctions;

  constructor(
    _core: InstantClient<Schema, RoomSchema, any>,
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
   * Listen for broadcasted events given a room and topic.
   *
   * @see https://instantdb.com/docs/presence-and-topics
   * @example
   *  function App({ roomId }) {
   *    db.room(roomType, roomId).useTopicEffect("chat", (message, peer) => {
   *      console.log("New message", message, 'from', peer.name);
   *    });
   *
   *    // ...
   *  }
   */
  useTopicEffect = <TopicType extends keyof RoomSchema[RoomType]["topics"]>(
    topic: MaybeSignal<Arrayable<TopicType>>,
    onEvent: Arrayable<
      (
        event: RoomSchema[RoomType]["topics"][TopicType],
        peer: RoomSchema[RoomType]["presence"]
      ) => any
    >
  ): (() => void) => {
    const cleanup: (() => void)[] = [];
    function unsubscribe() {
      cleanup.forEach((fn) => fn());
      cleanup.length = 0;
    }
    const stop = this._fn.effect(() => {
      const _topic = this._fn.toValue(topic);
      const id = this.id.value;
      const topicArray = Array.isArray(_topic) ? _topic : [_topic];
      const callbacks = Array.isArray(onEvent) ? onEvent : [onEvent];
      cleanup.push(
        ...topicArray.map((topicType) => {
          return this._core._reactor.subscribeTopic(
            id,
            topicType,
            (
              event: RoomSchema[RoomType]["topics"][TopicType],
              peer: RoomSchema[RoomType]["presence"]
            ) => {
              callbacks.forEach((cb) => {
                cb(event, peer);
              });
            }
          );
        })
      );
      return unsubscribe;
    });

    this._fn.onScopeDispose(() => {
      stop();
    });

    return stop;
  };

  /**
   * Broadcast an event to a room.
   *
   * @see https://instantdb.com/docs/presence-and-topics
   * @example
   * function App({ roomId }) {
   *   const publishTopic = db.room(roomType, roomId).usePublishTopic("clicks");
   *
   *   return (
   *     <button onClick={() => publishTopic({ ts: Date.now() })}>Click me</button>
   *   );
   * }
   */
  usePublishTopic = <Topic extends keyof RoomSchema[RoomType]["topics"]>(
    topic: MaybeSignal<Topic>
  ): ((data: RoomSchema[RoomType]["topics"][Topic]) => void) => {
    const stopRoomWatch = this._fn.effect(() => {
      const id = this.id.value;
      const cleanup = this._core._reactor.joinRoom(id);
      return cleanup;
    });

    let publishTopic = (data: RoomSchema[RoomType]["topics"][Topic]) => {};

    const stopTopicWatch = this._fn.effect(() => {
      const id = this.id.value;
      const type = this.type.value;
      const _topic = this._fn.toValue(topic);
      publishTopic = (data: RoomSchema[RoomType]["topics"][Topic]) => {
        this._core._reactor.publishTopic({
          roomType: type,
          roomId: id,
          topic: _topic,
          data,
        });
      };
    });

    this._fn.onScopeDispose(() => {
      stopRoomWatch();
      stopTopicWatch();
    });

    return publishTopic;
  };

  /**
   * Listen for peer's presence data in a room, and publish the current user's presence.
   *
   * @see https://instantdb.com/docs/presence-and-topics
   * @example
   *  function App({ roomId }) {
   *    const {
   *      peers,
   *      publishPresence
   *    } = db.room(roomType, roomId).usePresence({ keys: ["name", "avatar"] });
   *
   *    // ...
   *  }
   */
  usePresence = <Keys extends keyof RoomSchema[RoomType]["presence"]>(
    opts: MaybeSignal<PresenceOpts<RoomSchema[RoomType]["presence"], Keys>> = {}
  ): PresenceHandle<RoomSchema[RoomType]["presence"], Keys> => {
    const getInitialState = (): PresenceResponse<
      RoomSchema[RoomType]["presence"],
      Keys
    > => {
      const presence = this._core._reactor.getPresence(
        this.type.value,
        this.id.value,
        this._fn.toValue(opts)
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
      peers: this._fn.signal({}),
      isLoading: this._fn.signal(false),
      user: this._fn.signal(undefined),
      error: this._fn.signal(undefined),
    };

    const stop = this._fn.effect(() => {
      const id = this.id.value;
      const type = this.type.value;
      const _opts = this._fn.toValue(opts);

      Object.entries(getInitialState()).forEach(([key, value]) => {
        state[
          key as keyof PresenceResponse<RoomSchema[RoomType]["presence"], Keys>
        ].value = value;
      });

      const unsubscribe = this._core._reactor.subscribePresence(
        type,
        id,
        _opts,
        (data) => {
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

    this._fn.onScopeDispose(() => {
      stop();
    });

    return {
      ...state,
      publishPresence: (data) => {
        this._core._reactor.publishPresence(
          this.type.value,
          this.id.value,
          data
        );
      },
      stop,
    };
  };

  /**
   * Publishes presence data to a room
   *
   * @see https://instantdb.com/docs/presence-and-topics
   * @example
   *  function App({ roomId }) {
   *    db.room(roomType, roomId).useSyncPresence({ name, avatar, color });
   *
   *    // ...
   *  }
   */
  useSyncPresence = (
    data: MaybeSignal<Partial<RoomSchema[RoomType]["presence"]>>,
    deps?: MaybeSignal<any[]>
  ): void => {
    const stopRoomWatch = this._fn.effect(() => {
      const id = this.id.value;
      const cleanup = this._core._reactor.joinRoom(id);
      return cleanup;
    });

    const stop = this._fn.effect(() => {
      const id = this.id.value;
      const type = this.type.value;
      const _data = this._fn.toValue(data);
      this._core._reactor.joinRoom(id);
      // TODO! should this.type be a ref?
      this._core._reactor.publishPresence(type, id, _data);
      this._fn.toValue(deps);
    });

    this._fn.onScopeDispose(() => {
      stopRoomWatch();
      stop();
    });
  };

  /**
   * Manage typing indicator state
   *
   * @see https://instantdb.com/docs/presence-and-topics
   * @example
   *  function App({ roomId }) {
   *    const {
   *      active,
   *      setActive,
   *      inputProps,
   *    } = db.room(roomType, roomId).useTypingIndicator("chat-input", opts);
   *
   *    return <input onBlur={inputProps.onBlur} onKeydown={inputProps.onKeyDown} />;
   *  }
   */
  useTypingIndicator = (
    inputName: MaybeSignal<string>,
    opts: MaybeSignal<TypingIndicatorOpts> = {}
  ): TypingIndicatorHandle<RoomSchema[RoomType]["presence"]> => {
    const timeout = useTimeout({ onScopeDispose: this._fn.onScopeDispose });

    const _inputName = this._fn.toValue(inputName);

    //@ts-ignore TODO! same error in InstantReact
    const onservedPresence = this.usePresence(() => ({
      keys: [this._fn.toValue(inputName)],
    }));

    const active = this._fn.computed(() => {
      const presenceSnapshot = this._core._reactor.getPresence(
        this.type.value,
        this.id.value
      );
      onservedPresence.peers.value;

      return this._fn.toValue(opts)?.writeOnly
        ? []
        : Object.values(presenceSnapshot?.peers ?? {}).filter(
            //@ts-ignore TODO! same error in InstantReact
            (p) => p[_inputName] === true
          );
    });

    const setActive = (isActive: boolean) => {
      const _opts = this._fn.toValue(opts);
      const _inputName = this._fn.toValue(inputName);
      const id = this.id.value;
      const type = this.type.value;
      this._core._reactor.publishPresence(type, id, {
        [_inputName]: isActive,
      } as unknown as Partial<RoomSchema[RoomType]>);

      if (!isActive) return;

      if (_opts?.timeout === null || _opts?.timeout === 0) return;

      timeout.set(_opts?.timeout ?? defaultActivityStopTimeout, () => {
        this._core._reactor.publishPresence(type, id, {
          [_inputName]: null,
        } as Partial<RoomSchema[RoomType]>);
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const _opts = this._fn.toValue(opts);
      const isEnter = _opts?.stopOnEnter && e.key === "Enter";
      const isActive = !isEnter;

      setActive(isActive);
    };

    function stop() {
      timeout.clear();
    }

    this._fn.onScopeDispose(() => {
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
  };
}

export class InstantByos<
  Schema extends InstantGraph<any, any> | {} = {},
  RoomSchema extends RoomSchemaShape = {},
  WithCardinalityInference extends boolean = false
> implements IDatabase
{
  //@ts-ignore TODO! same error in InstantReact with strict flag enabled
  public tx =
    txInit<
      Schema extends InstantGraph<any, any> ? Schema : InstantGraph<any, any>
    >();

  public auth: Auth;
  public storage: Storage;
  public _core: InstantClient<Schema, RoomSchema, WithCardinalityInference>;
  public readonly _fn: SignalFunctions;

  static Storage?: any;
  static NetworkListener?: any;

  constructor(
    config: Config | ConfigWithSchema<any>,
    signalFunctions: SignalFunctions
  ) {
    this._core = _init_internal<Schema, RoomSchema, WithCardinalityInference>(
      config,
      // @ts-expect-error because TS can't resolve subclass statics
      this.constructor.Storage,
      // @ts-expect-error because TS can't resolve subclass statics
      this.constructor.NetworkListener
    );
    this.auth = this._core.auth;
    this.storage = this._core.storage;
    this._fn = signalFunctions;
  }

  getLocalId = (name: string) => {
    return this._core.getLocalId(name);
  };

  /**
   * Obtain a handle to a room, which allows you to listen to topics and presence data
   *
   * If you don't provide a `type` or `id`, Instant will default to `_defaultRoomType` and `_defaultRoomId`
   * as the room type and id, respectively.
   *
   * @see https://instantdb.com/docs/presence-and-topics
   *
   * @example
   *  const {
   *   useTopicEffect,
   *   usePublishTopic,
   *   useSyncPresence,
   *   useTypingIndicator,
   * } = db.room(roomType, roomId);
   */
  room<RoomType extends keyof RoomSchema>(
    type?: MaybeSignal<RoomType | undefined>,
    id?: MaybeSignal<string | undefined>
  ) {
    const _type = this._fn.computed(() => {
      return this._fn.toValue(type) || ("_defaultRoomType" as RoomType);
    });
    const _id = this._fn.computed(() => {
      return this._fn.toValue(id) || "_defaultRoomId";
    });

    return new InstantByosRoom<Schema, RoomSchema, RoomType>(
      this._core,
      _type,
      _id,
      this._fn
    );
  }

  /**
   * Use this to write data! You can create, update, delete, and link objects
   *
   * @see https://instantdb.com/docs/instaml
   *
   * @example
   *   // Create a new object in the `goals` namespace
   *   const goalId = id();
   *   db.transact(tx.goals[goalId].update({title: "Get fit"}))
   *
   *   // Update the title
   *   db.transact(tx.goals[goalId].update({title: "Get super fit"}))
   *
   *   // Delete it
   *   db.transact(tx.goals[goalId].delete())
   *
   *   // Or create an association:
   *   todoId = id();
   *   db.transact([
   *    tx.todos[todoId].update({ title: 'Go on a run' }),
   *    tx.goals[goalId].link({todos: todoId}),
   *  ])
   */
  transact = (
    chunks: TransactionChunk<any, any> | TransactionChunk<any, any>[]
  ) => {
    return this._core.transact(chunks);
  };

  /**
   * Use this to query your data!
   *
   * @see https://instantdb.com/docs/instaql
   *
   * @example
   *  // listen to all goals
   *  db.useQuery({ goals: {} })
   *
   *  // goals where the title is "Get Fit"
   *  db.useQuery({ goals: { $: { where: { title: "Get Fit" } } } })
   *
   *  // all goals, _alongside_ their todos
   *  db.useQuery({ goals: { todos: {} } })
   *
   *  // skip if `user` is not logged in
   *  db.useQuery(auth.user ? { goals: {} } : null)
   */
  useQuery = <
    Q extends Schema extends InstantGraph<any, any>
      ? InstaQLQueryParams<Schema>
      : Exactly<
          Query,
          //@ts-ignore TODO! same error in InstantReact with strict flag enabled
          Q
        >
  >(
    query: MaybeSignal<null | Q>
  ): UseQueryReturn<Q, Schema, WithCardinalityInference> => {
    //@ts-ignore TODO! same error in InstantReact
    return useQuery(this._core, query, this._fn).state;
  };

  /**
   * Listen for the logged in state. This is useful
   * for deciding when to show a login screen.
   *
   * Check out the docs for an example `Login` component too!
   *
   * @see https://instantdb.com/docs/auth
   * @example
   *  function App() {
   *    const { isLoading, user, error } = db.useAuth()
   *    if (isLoading.value) {
   *      return <div>Loading...</div>
   *    }
   *    if (error.value) {
   *      return <div>Uh oh! {error.value.message}</div>
   *    }
   *    if (user.value) {
   *      return <Main user={user} />
   *    }
   *    return <Login />
   *  }
   */
  useAuth = (): UseAuthReturn & { stop: () => void } => {
    const initialState = this._core._reactor._currentUserCached;

    const state: UseAuthReturn & { stop: () => void } = {
      isLoading: this._fn.signal(initialState.isLoading),
      user: this._fn.signal(initialState.user),
      error: this._fn.signal(initialState.error),
      stop: () => {},
    };
    const unsubscribe = this._core._reactor.subscribeAuth((resp: any) => {
      state.isLoading.value = false;
      state.user.value = resp.user;
      state.error.value = resp.error;
    });

    state.stop = () => {
      unsubscribe();
    };

    this._fn.onScopeDispose(() => {
      unsubscribe();
    });

    return state;
  };

  /**
   * Use this for one-off queries.
   * Returns local data if available, otherwise fetches from the server.
   * Because we want to avoid stale data, this method will throw an error
   * if the user is offline or there is no active connection to the server.
   *
   * @see https://instantdb.com/docs/instaql
   *
   * @example
   *
   *  const resp = await db.queryOnce({ goals: {} });
   *  console.log(resp.data.goals)
   */
  queryOnce = <
    Q extends Schema extends InstantGraph<any, any>
      ? InstaQLQueryParams<Schema>
      : Exactly<Query, Q>
  >(
    query: Q
  ): Promise<{
    data: QueryResponse<Q, Schema, WithCardinalityInference>;
    pageInfo: PageInfoResponse<Q>;
  }> => {
    return this._core.queryOnce(query);
  };
}
