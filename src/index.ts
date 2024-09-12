// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import { id, tx, lookup, i } from "@instantdb/core";
import type {
  QueryResponse,
  InstantQuery,
  InstantQueryResult,
  InstantObject,
  User,
  AuthState,
  Query,
  Config,
} from "@instantdb/core";

import { InstantByos } from "./InstantByos";
import { init, init_experimental } from "./init";

import { useCursors } from "./cursors";

import type {
  Signal,
  Computed,
  SignalFn,
  ComputedFn,
  MaybeSignal,
  ToValueFn,
  EffectFn,
  OnScopeDisposeFn,
  SignalFunctions,
} from "./types";

export { id, tx, lookup, init, init_experimental, InstantByos, i, useCursors };
export type {
  QueryResponse,
  InstantQuery,
  InstantQueryResult,
  InstantObject,
  User,
  AuthState,
  Query,
  Config,
  Signal,
  Computed,
  SignalFn,
  ComputedFn,
  MaybeSignal,
  ToValueFn,
  EffectFn,
  OnScopeDisposeFn,
  SignalFunctions,
};
