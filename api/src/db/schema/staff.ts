import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import type { Character } from "~/models/staff";
import { shows } from "./shows";
import { externalid, image, schema } from "./utils";

export const roleKind = schema.enum("role_kind", [
	"actor",
	"director",
	"writter",
	"producer",
	"music",
	"other",
]);

export const staff = schema.table("staff", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
	id: uuid().notNull().unique().defaultRandom(),
	slug: varchar({ length: 255 }).notNull().unique(),
	name: text().notNull(),
	latinName: text(),
	image: image(),
	externalId: externalid(),

	createdAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.$onUpdate(() => sql`now()`),
});

export const roles = schema.table(
	"roles",
	{
		showPk: integer()
			.notNull()
			.references(() => shows.pk, { onDelete: "cascade" }),
		staffPk: integer()
			.notNull()
			.references(() => staff.pk, { onDelete: "cascade" }),
		kind: roleKind().notNull(),
		order: integer().notNull(),
		character: jsonb().$type<Character>(),
	},
	(t) => [
		primaryKey({ columns: [t.showPk, t.staffPk] }),
		index("role_kind").using("hash", t.kind),
		index("role_order").on(t.order),
	],
);

export const staffRelations = relations(staff, ({ many }) => ({
	roles: many(roles, { relationName: "staff_roles" }),
}));
export const rolesRelations = relations(roles, ({ one }) => ({
	staff: one(staff, {
		relationName: "staff_roles",
		fields: [roles.staffPk],
		references: [staff.pk],
	}),
	show: one(shows, {
		relationName: "show_roles",
		fields: [roles.showPk],
		references: [shows.pk],
	}),
}));
