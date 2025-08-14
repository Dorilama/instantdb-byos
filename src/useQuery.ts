// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import { weakHash, coerceQuery, InstantCoreDatabase } from "@instantdb/core";
import type {
  InstaQLParams,
  InstaQLOptions,
  InstaQLLifecycleState,
  InstantSchemaDef,
} from "@instantdb/core";
import type {
  Signal,
  SignalFn,
  ComputedFn,
  MaybeSignal,
  ToValueFn,
  EffectFn,
  OnScopeDisposeFn,
} from "./types";
import type { Extra } from "./init";

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

export function useQueryInternal<
  Q extends InstaQLParams<Schema>,
  Schema extends InstantSchemaDef<any, any, any>
>(
  _core: InstantCoreDatabase<Schema>,
  _query: MaybeSignal<null | Q>,
  _opts: MaybeSignal<InstaQLOptions | null> | undefined,
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
    onScopeDispose?: OnScopeDisposeFn;
  },
  extra?: Extra
): {
  state: UseQueryInternalReturn<Schema, Q>;
  query: any;
} {
  const query = computed(() => {
    let __query = toValue(_query);
    const __opts = toValue(_opts);
    if (__query && __opts && "ruleParams" in __opts) {
      __query = { $$ruleParams: __opts["ruleParams"], ...__query };
    }
    return __query ? coerceQuery(__query) : null;
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

  if (!extra?.clientOnlyUseQuery || _core._reactor.querySubs) {
    const stop = effect(() => {
      queryHash.value;

      const currentState = stateForResult(
        _core._reactor.getPreviousResult(query.peek())
      );
      state.isLoading.value = currentState.isLoading;
      state.data.value = currentState.data;
      state.pageInfo.value = currentState.pageInfo;
      state.error.value = currentState.error;

      if (!query.peek()) {
        if (extra?.stopLoadingOnNullQuery) {
          state.isLoading.value = false;
        }
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
  }

  onScopeDispose?.(() => {
    stop();
  });

  return { state, query };
}
