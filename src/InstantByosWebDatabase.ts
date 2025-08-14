// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import type { InstantSchemaDef } from "@instantdb/core";
import type { InstantConfig } from "./init";
import InstantByosAbstractDatabase from "./InstantByosAbstractDatabase";

export default class InstantByosWebDatabase<
  Schema extends InstantSchemaDef<any, any, any>,
  Config extends InstantConfig<Schema, boolean> = InstantConfig<Schema, false>
> extends InstantByosAbstractDatabase<Schema, Config> {}
