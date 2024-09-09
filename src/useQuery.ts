// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import { weakHash, coerceQuery, i } from "@instantdb/core";
import type {
  Query,
  Exactly,
  InstantClient,
  LifecycleSubscriptionState,
  InstaQLQueryParams,
} from "@instantdb/core";
import type {
  Signal,
  SignalFn,
  Computed,
  ComputedFn,
  MaybeSignal,
  ToValue,
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
};

export function useQuery<
  Q extends Schema extends i.InstantGraph<any, any>
    ? InstaQLQueryParams<Schema>
    : //@ts-ignore TODO! same error in InstantReact with strict flag enabled
      Exactly<Query, Q>,
  Schema extends {} | i.InstantGraph<any, any, {}>,
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
    toValue: typeof ToValue;
    effect: EffectFn;
    onScopeDispose: OnScopeDisposeFn;
  }
): {
  state: UseQueryReturn<Q, Schema, WithCardinalityInference>;
  query: any;
  stop: () => void;
} {
  const query = computed(() => {
    const value = toValue(_query);
    return value ? coerceQuery(value) : null;
  });
  const queryHash = computed(() => {
    return weakHash(query.value);
  });

  const state: UseQueryReturn<Q, Schema, WithCardinalityInference> = {
    isLoading: signal(true),
    data: signal(undefined),
    pageInfo: signal(undefined),
    error: signal(undefined),
  };

  const stop = effect(() => {
    const queryValue = query.peek();
    queryHash.value;
    if (!queryValue) {
      return;
    }
    const unsubscribe = _core.subscribeQuery<Q>(queryValue, (result) => {
      state.isLoading.value = !Boolean(result);
      state.data.value = result.data;
      state.pageInfo.value = result.pageInfo;
      state.error.value = result.error;
    });
    return unsubscribe;
  });

  onScopeDispose(() => {
    stop();
  });

  return { state, query, stop };
}
