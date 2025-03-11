import { integer } from "drizzle-orm/pg-core";
import { schema } from "./utils";

export const profiles = schema.table("profiles", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
});
