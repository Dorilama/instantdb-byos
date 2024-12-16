// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import type {
  Config,
  InstantConfig,
  InstantGraph,
  InstantSchemaDef,
  RoomSchemaShape,
  InstantUnknownSchema,
} from "@instantdb/core";
import { InstantByos } from "./InstantByos";
import { InstantByosDatabase } from "./InstantByosDatabase";
import type { SignalFunctions } from "./types";

export type ExtraConfig = Partial<{
  Storage: any;
  NetworkListener: any;
  onBeforeInit: () => void;
}>;

/**
 *
 * The first step: init your application!
 *
 * Visit https://instantdb.com/dash to get your `appId` :)
 *
 * @example
 *  import { signal, computed, effect, Signal} from '@preact/signals'
 *  import {init, type ToValueFn} from '@dorilama/instantdb-byos'
 *
 *  function onScopeDispose(){
 *    // cleanup
 *  }
 *
 *  const toValue: typeof ToValueFn= (maybeSignal) => {
 *    if(maybeSignal instanceof Signal){
 *      return maybeSignal.value
 *    }
 *    return maybeSignal
 *  }
 *
 *  const db = init({ appId: "my-app-id" },{signal, computed, effect, toValue, onScopeDispose})
 *
 * // You can also provide a a schema for type safety and editor autocomplete!
 *
 *  type Schema = {
 *    goals: {
 *      title: string
 *    }
 *  }
 *
 *  const db = init<Schema>({ appId: "my-app-id" },{signal, computed, effect, toValue, onScopeDispose})
 *
 */
export function init<
  Schema extends {} = {},
  RoomSchema extends RoomSchemaShape = {}
>(config: Config, signalFunctions: SignalFunctions, extraConfig?: ExtraConfig) {
  return new InstantByos<Schema, RoomSchema>(
    config,
    signalFunctions,
    extraConfig
  );
}

export function init_experimental<
  Schema extends InstantSchemaDef<any, any, any> = InstantUnknownSchema
>(
  config: InstantConfig<Schema>,
  signalFunctions: SignalFunctions,
  extraConfig?: ExtraConfig
) {
  return new InstantByosDatabase<Schema>(config, signalFunctions, extraConfig);
}
