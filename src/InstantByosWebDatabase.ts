import type { InstantSchemaDef } from "@instantdb/core";
import InstantByosAbstractDatabase from "./InstantByosAbstractDatabase";

export default class InstantByosWebDatabase<
  Schema extends InstantSchemaDef<any, any, any>
> extends InstantByosAbstractDatabase<Schema> {}
