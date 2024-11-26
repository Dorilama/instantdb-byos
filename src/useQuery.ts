// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import { weakHash, coerceQuery, InstantCoreDatabase } from "@instantdb/core";
import type {
  Query,
  Exactly,
  InstantClient,
  LifecycleSubscriptionState,
  InstaQLParams,
  InstantGraph,
  InstaQLLifecycleState,
  InstantSchemaDef,
} from "@instantdb/core";
import type {
  Signal,
  SignalFn,
  Computed,
  ComputedFn,
  MaybeSignal,
  ToValueFn,
  EffectFn,
  OnScopeDisposeFn,
} from "./types";

export type UseQueryReturn<
  Q,
  Schema,
  WithCardinalityInference extends boolean
> = {
  [K in keyof LifecycleSubscriptionState<
    Q,
    Schema,
    WithCardinalityInference
  >]: Signal<
    LifecycleSubscriptionState<Q, Schema, WithCardinalityInference>[K]
  >;
} & { stop: () => void };

export type UseQueryInternalReturn<Schema, Q> = {
  [K in keyof InstaQLLifecycleState<Schema, Q>]: Signal<
    InstaQLLifecycleState<Schema, Q>[K]
  >;
} & { stop: () => void };

function stateForResult(result: any) {
  return {
    isLoading: !Boolean(result),
    data: undefined,
    pageInfo: undefined,
    error: undefined,
    ...(result ? result : {}),
  };
}

export function useQuery<
  Q extends Schema extends InstantGraph<any, any>
    ? InstaQLParams<Schema>
    : Exactly<
        Query,
        //@ts-ignore TODO! same error in InstantReact with strict flag enabled
        Q
      >,
  Schema extends InstantGraph<any, any, any> | {},
  WithCardinalityInference extends boolean
>(
  _core: InstantClient<Schema, any, WithCardinalityInference>,
  _query: MaybeSignal<null | Q>,
  {
    signal,
    computed,
    toValue,
    effect,
    onScopeDispose,
  }: {
    signal: typeof SignalFn;
    computed: typeof ComputedFn;
    toValue: typeof ToValueFn;
    effect: EffectFn;
    onScopeDispose: OnScopeDisposeFn;
  }
): {
  state: UseQueryReturn<Q, Schema, WithCardinalityInference>;
  query: any;
} {
  const query = computed(() => {
    const value = toValue(_query);
    return value ? coerceQuery(value) : null;
  });
  const queryHash = computed(() => {
    return weakHash(query.value);
  });

  const initialState = stateForResult(
    _core._reactor.getPreviousResult(query.value)
  );

  const state: UseQueryReturn<Q, Schema, WithCardinalityInference> = {
    isLoading: signal(initialState.isLoading),
    data: signal(initialState.data),
    pageInfo: signal(initialState.pageInfo),
    error: signal(initialState.error),
    stop: () => {},
  };

  const stop = effect(() => {
    queryHash.value;
    if (!query.peek()) {
      state.isLoading.value = false;
      return;
    }
    const unsubscribe = _core.subscribeQuery<Q>(query.peek(), (result) => {
      state.isLoading.value = !Boolean(result);
      state.data.value = result.data;
      state.pageInfo.value = result.pageInfo;
      state.error.value = result.error;
    });
    return unsubscribe;
  });

  state.stop = stop;

  onScopeDispose(() => {
    stop();
  });

  return { state, query };
}

export function useQueryInternal<
  Q extends InstaQLParams<Schema>,
  Schema extends InstantSchemaDef<any, any, any>
>(
  _core: InstantCoreDatabase<Schema>,
  _query: MaybeSignal<null | Q>,
  {
    signal,
    computed,
    toValue,
    effect,
    onScopeDispose,
  }: {
    signal: typeof SignalFn;
    computed: typeof ComputedFn;
    toValue: typeof ToValueFn;
    effect: EffectFn;
    onScopeDispose: OnScopeDisposeFn;
  }
): {
  state: UseQueryInternalReturn<Schema, Q>;
  query: any;
} {
  const query = computed(() => {
    const value = toValue(_query);
    return value ? coerceQuery(value) : null;
  });
  const queryHash = computed(() => {
    return weakHash(query.value);
  });

  const initialState = stateForResult(
    _core._reactor.getPreviousResult(query.value)
  );

  const state: UseQueryInternalReturn<Schema, Q> = {
    isLoading: signal(initialState.isLoading),
    data: signal(initialState.data),
    pageInfo: signal(initialState.pageInfo),
    error: signal(initialState.error),
    stop: () => {},
  };

  const stop = effect(() => {
    queryHash.value;
    if (!query.peek()) {
      state.isLoading.value = false;
      return;
    }
    const unsubscribe = _core.subscribeQuery<Q>(query.peek(), (result) => {
      state.isLoading.value = !Boolean(result);
      state.data.value = result.data;
      state.pageInfo.value = result.pageInfo;
      state.error.value = result.error;
    });
    return unsubscribe;
  });

  state.stop = stop;

  onScopeDispose(() => {
    stop();
  });

  return { state, query };
}
