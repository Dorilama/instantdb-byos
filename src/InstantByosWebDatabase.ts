// Notice:
// adapted from [@instantdb/react](https://github.com/instantdb/instant/blob/main/client/packages/react/README.md)
// see instantdb-license.md for license

import type { InstantSchemaDef } from "@instantdb/core";
import InstantByosAbstractDatabase from "./InstantByosAbstractDatabase";

export default class InstantByosWebDatabase<
  Schema extends InstantSchemaDef<any, any, any>
> extends InstantByosAbstractDatabase<Schema> {}
