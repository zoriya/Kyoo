import { integer, uuid } from "drizzle-orm/pg-core";
import { schema } from "./utils";

// user info is stored in keibi (the auth service).
// this table is only there for relations.
export const profiles = schema.table("profiles", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
	id: uuid().notNull().unique(),
});
