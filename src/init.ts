// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import type { Config, RoomSchemaShape, i } from "@instantdb/core";
import { InstantByos } from "./InstantByos";
import type { SignalFunctions } from "./types";

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
export function init<Schema = {}, RoomSchema extends RoomSchemaShape = {}>(
  config: Config,
  signalFunctions: SignalFunctions
) {
  return new InstantByos<
    //@ts-ignore TODO! same error in InstantReact with strict flag enabled
    Schema,
    RoomSchema
  >(config, signalFunctions);
}

export function init_experimental<
  Schema extends i.InstantGraph<any, any, any>,
  WithCardinalityInference extends boolean = true
>(
  config: Config & {
    schema: Schema;
    cardinalityInference?: WithCardinalityInference;
  },
  signalFunctions: SignalFunctions
) {
  return new InstantByos<
    Schema,
    Schema extends i.InstantGraph<any, any, infer RoomSchema>
      ? RoomSchema
      : never,
    WithCardinalityInference
  >(config, signalFunctions);
}
