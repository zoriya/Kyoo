import { sql } from "drizzle-orm";
import {
	boolean,
	integer,
	pgSchema,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
	id: uuid().notNull().unique().defaultRandom(),
	username: text().notNull().unique(),
	displayName: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: boolean().notNull(),
	image: text(),
	createdAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.$onUpdate(() => sql`now()`),
});

export const sessions = authSchema.table("sessions", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
	id: uuid().notNull().unique().defaultRandom(),
	expiresAt: timestamp().notNull(),
	token: text().notNull().unique(),
	createdAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.$onUpdate(() => sql`now()`),
	ipAddress: text(),
	userAgent: text(),
	userPk: integer()
		.notNull()
		.references(() => users.pk, { onDelete: "cascade" }),
});

export const accounts = authSchema.table("accounts", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
	id: uuid().notNull().unique().defaultRandom(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userPk: integer()
		.notNull()
		.references(() => users.pk, { onDelete: "cascade" }),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ withTimezone: true, mode: "string" }),
	refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: "string" }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.$onUpdate(() => sql`now()`),
});

export const verifications = authSchema.table("verifications", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
	id: uuid().notNull().unique().defaultRandom(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.$onUpdate(() => sql`now()`),
});
