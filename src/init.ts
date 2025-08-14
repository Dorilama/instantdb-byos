// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import type {
  InstantConfig as OriginalInstantConfig,
  InstantSchemaDef,
  InstantUnknownSchema,
} from "@instantdb/core";
import InstantByosWebDatabase from "./InstantByosWebDatabase";
import type { SignalFunctions } from "./types";
import version from "./version";

export interface Extra {
  clientOnlyUseQuery: boolean;
  stopLoadingOnNullQuery: boolean;
}

type ExtraConfig = {
  __extra_byos?: Partial<Extra>;
};

export type InstantConfig<
  S extends InstantSchemaDef<any, any, any>,
  UseDates extends boolean = false
> = OriginalInstantConfig<S, UseDates> & ExtraConfig;

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
 *  const toValue: typeof ToValueFn= (maybeSignal) => {
 *    if(maybeSignal instanceof Signal){
 *      return maybeSignal.value
 *    }
 *    return maybeSignal
 *  }
 *
 *  const db = init({ appId: "my-app-id" },{signal, computed, effect, toValue})
 *
 * // You can also provide a a schema for type safety and editor autocomplete!
 *
 * import schema from ""../instant.schema.ts";
 *
 * const db = init({ appId: "my-app-id", schema },{signal, computed, effect, toValue, onScopeDispose})
 *
 */
export function init<
  Schema extends InstantSchemaDef<any, any, any> = InstantUnknownSchema,
  UseDates extends boolean = false
>(config: InstantConfig<Schema, UseDates>, signalFunctions: SignalFunctions) {
  return new InstantByosWebDatabase<Schema, InstantConfig<Schema, UseDates>>(
    config,
    signalFunctions,
    {
      "@dorilama/instantdb-byos": version,
    }
  );
}

/**
 * @deprecated
 * `init_experimental` is deprecated. You can replace it with `init`.
 *
 * @example
 *
 * // Before
 * import { init_experimental } from "@dorilama/instantdb-byos"
 * const db = init_experimental({  ...  });
 *
 * // After
 * import { init } from "@dorilama/instantdb-byos"
 * const db = init({ ...  });
 */
export const init_experimental = init;
