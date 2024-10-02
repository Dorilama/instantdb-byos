// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import { id, tx, lookup, i } from "@instantdb/core";
import type {
  QueryResponse,
  InstantQuery,
  InstantQueryResult,
  InstantSchema,
  InstantObject,
  InstantEntity,
  InstantSchemaDatabase,
  User,
  AuthState,
  Query,
  Config,
  InstaQLQueryParams,
  // schema types
  AttrsDefs,
  CardinalityKind,
  DataAttrDef,
  EntitiesDef,
  EntitiesWithLinks,
  EntityDef,
  InstantGraph,
  LinkAttrDef,
  LinkDef,
  LinksDef,
  ResolveAttrs,
  ValueTypes,
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
  Config,
  Query,
  QueryResponse,
  InstantObject,
  User,
  AuthState,
  InstantQuery,
  InstantQueryResult,
  InstantSchema,
  InstantEntity,
  InstantSchemaDatabase,
  InstaQLQueryParams,
  // schema types
  AttrsDefs,
  CardinalityKind,
  DataAttrDef,
  EntitiesDef,
  EntitiesWithLinks,
  EntityDef,
  InstantGraph,
  LinkAttrDef,
  LinkDef,
  LinksDef,
  ResolveAttrs,
  ValueTypes,
  //
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
