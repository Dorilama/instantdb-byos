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
  IInstantDatabase,
  User,
  AuthState,
  Query,
  InstantConfig,
  InstaQLParams,
  ConnectionStatus,
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
  InstaQLEntity,
  InstaQLResult,
  InstantUnknownSchema,
  InstantSchemaDef,
  BackwardsCompatibleSchema,
  InstantRules,
  UpdateParams,
  LinkParams,
} from "@instantdb/core";

import { InstantByosDatabase } from "./InstantByosDatabase";
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

export {
  id,
  tx,
  lookup,
  init,
  init_experimental,
  InstantByosDatabase,
  i,
  useCursors,
};
export type {
  InstantConfig,
  Query,
  QueryResponse,
  InstantObject,
  User,
  AuthState,
  ConnectionStatus,
  InstantQuery,
  InstantQueryResult,
  InstantSchema,
  InstantEntity,
  InstantSchemaDatabase,
  IInstantDatabase,
  InstaQLParams,
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
  InstaQLEntity,
  InstaQLResult,
  InstantUnknownSchema,
  InstantSchemaDef,
  BackwardsCompatibleSchema,
  InstantRules,
  UpdateParams,
  LinkParams,
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
