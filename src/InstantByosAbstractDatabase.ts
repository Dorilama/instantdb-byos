// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import {
  Auth,
  Storage,
  txInit,
  InstantCoreDatabase,
  init as core_init,
} from "@instantdb/core";
import type {
  AuthState,
  User,
  ConnectionStatus,
  TransactionChunk,
  PresenceOpts,
  RoomSchemaShape,
  InstaQLParams,
  InstaQLOptions,
  PageInfoResponse,
  InstaQLResponse,
  RoomsOf,
  InstantSchemaDef,
  IInstantDatabase,
} from "@instantdb/core";
import { useQueryInternal } from "./useQuery";
import type { UseQueryInternalReturn } from "./useQuery";
import type {
  Signal,
  MaybeSignal,
  SignalFunctions,
  OnScopeDisposeFn,
  Arrayable,
} from "./types";
import {
  InstantByosRoom,
  rooms,
  type TypingIndicatorOpts,
} from "./InstantByosRoom";
import type { InstantConfig, Extra } from "./init";

type UseAuthReturn = { [K in keyof AuthState]: Signal<AuthState[K]> };

export default abstract class InstantByosAbstractDatabase<
  Schema extends InstantSchemaDef<any, any, any>,
  Rooms extends RoomSchemaShape = RoomsOf<Schema>
> implements IInstantDatabase<Schema>
{
  public tx = txInit<Schema>();

  public auth: Auth;
  public storage: Storage;
  public _core: InstantCoreDatabase<Schema>;
  public readonly _fn: SignalFunctions;

  static Storage?: any;
  static NetworkListener?: any;

  static extra: Extra;

  constructor(
    config: InstantConfig<Schema>,
    signalFunctions: SignalFunctions,
    versions?: { [key: string]: string }
  ) {
    const { __extra_byos, ..._config } = config;

    this._core = core_init<Schema>(
      _config,
      // @ts-expect-error because TS can't resolve subclass statics
      this.constructor.Storage,
      // @ts-expect-error because TS can't resolve subclass statics
      this.constructor.NetworkListener,
      versions
    );
    this.auth = this._core.auth;
    this.storage = this._core.storage;
    this._fn = signalFunctions;
    // @ts-expect-error because TS can't resolve subclass statics
    this.constructor.extra = {
      clientOnlyUseQuery: !!__extra_byos?.clientOnlyUseQuery,
      stopLoadingOnNullQuery: !!__extra_byos?.stopLoadingOnNullQuery,
    } satisfies Extra;
  }

  /**
   * Returns a unique ID for a given `name`. It's stored in local storage,
   * so you will get the same ID across sessions.
   *
   * This is useful for generating IDs that could identify a local device or user.
   *
   * @example
   *  const deviceId = await db.getLocalId('device');
   */
  getLocalId = (name: string) => {
    return this._core.getLocalId(name);
  };

  /**
   * A hook that returns a unique ID for a given `name`. localIds are
   * stored in local storage, so you will get the same ID across sessions.
   *
   * Initially returns `null`, and then loads the localId.
   *
   * @example
   * const deviceId = db.useLocalId('device');
   * effect(()=>{
   *   if(deviceId.value){
   *     console.log('Device ID:', value)
   *   }
   * })
   */
  useLocalId = (name: MaybeSignal<string>): Signal<string | null> => {
    const localId = this._fn.signal<string | null>(null);

    this._fn.effect(() => {
      const _name = this._fn.toValue(name);
      this.getLocalId(_name).then((id) => {
        if (this._fn.toValue(name) === _name) {
          localId.value = id;
        }
      });
    });

    return localId;
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
   *  const room = db.room('chat', roomId);
   *  const { peers } = db.rooms.usePresence(room);
   */
  room<RoomType extends keyof Rooms>(
    type?: MaybeSignal<RoomType | undefined>,
    id?: MaybeSignal<string | undefined>
  ) {
    const _type = this._fn.computed(() => {
      return this._fn.toValue(type) || ("_defaultRoomType" as RoomType);
    });
    const _id = this._fn.computed(() => {
      return this._fn.toValue(id) || "_defaultRoomId";
    });

    return new InstantByosRoom<Schema, Rooms, RoomType>(
      this._core,
      _type,
      _id,
      this._fn
    );
  }

  /**
   * Hooks for working with rooms
   *
   * @see https://instantdb.com/docs/presence-and-topics
   *
   * @example
   *  const room = db.room('chat', roomId);
   *  const { peers } = db.rooms.usePresence(room);
   *  const publish = db.rooms.usePublishTopic(room, 'emoji');
   */
  rooms = rooms;

  /**
   * Use this to write data! You can create, update, delete, and link objects
   *
   * @see https://instantdb.com/docs/instaml
   *
   * @example
   *   // Create a new object in the `goals` namespace
   *   const goalId = id();
   *   db.transact(db.tx.goals[goalId].update({title: "Get fit"}))
   *
   *   // Update the title
   *   db.transact(db.tx.goals[goalId].update({title: "Get super fit"}))
   *
   *   // Delete it
   *   db.transact(db.tx.goals[goalId].delete())
   *
   *   // Or create an association:
   *   todoId = id();
   *   db.transact([
   *    db.tx.todos[todoId].update({ title: 'Go on a run' }),
   *    db.tx.goals[goalId].link({todos: todoId}),
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
  useQuery = <Q extends InstaQLParams<Schema>>(
    query: MaybeSignal<null | Q>,
    opts?: MaybeSignal<InstaQLOptions | null>
  ): UseQueryInternalReturn<Schema, Q> => {
    return useQueryInternal(this._core, query, opts, this._fn).state;
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

    this._fn.onScopeDispose?.(() => {
      unsubscribe();
    });

    return state;
  };

  /**
   * One time query for the logged in state. This is useful
   * for scenarios where you want to know the current auth
   * state without subscribing to changes.
   *
   * @see https://instantdb.com/docs/auth
   * @example
   *   const user = await db.getAuth();
   *   console.log('logged in as', user.email)
   */
  getAuth = (): Promise<User | null> => {
    return this._core.getAuth();
  };

  /**
   * Listen for connection status changes to Instant. Use this for things like
   * showing connection state to users
   *
   * @see https://www.instantdb.com/docs/patterns#connection-status
   * @example
   *  function App() {
   *    const status = db.useConnectionStatus()
   *    const connectionState =
   *      status === 'connecting' || status === 'opened'
   *        ? 'authenticating'
   *      : status === 'authenticated'
   *        ? 'connected'
   *      : status === 'closed'
   *        ? 'closed'
   *      : status === 'errored'
   *        ? 'errored'
   *      : 'unexpected state';
   *
   *    return <div>Connection state: {connectionState}</div>
   *  }
   */
  useConnectionStatus = (
    onScopeDispose?: OnScopeDisposeFn
  ): Signal<ConnectionStatus> => {
    const status = this._fn.signal<ConnectionStatus>(
      this._core._reactor.status as ConnectionStatus
    );
    const unsubscribe = this._core.subscribeConnectionStatus((newStatus) => {
      status.value = newStatus;
    });

    if (onScopeDispose) {
      onScopeDispose(unsubscribe);
    }

    this._fn.onScopeDispose?.(unsubscribe);

    return status;
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
  queryOnce = <Q extends InstaQLParams<Schema>>(
    query: Q,
    opts?: InstaQLOptions
  ): Promise<{
    data: InstaQLResponse<Schema, Q>;
    pageInfo: PageInfoResponse<Q>;
  }> => {
    return this._core.queryOnce(query, opts);
  };
}
