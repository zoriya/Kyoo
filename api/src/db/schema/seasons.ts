import {
	date,
	index,
	integer,
	jsonb,
	primaryKey,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { image, language, schema } from "./utils";

export const season_extid = () =>
	jsonb()
		.$type<
			Record<
				string,
				{
					serieId: string;
					season: number;
					link: string | null;
				}
			>
		>()
		.notNull()
		.default({});

export const seasons = schema.table(
	"seasons",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: uuid().notNull().unique().defaultRandom(),
		slug: varchar({ length: 255 }).notNull().unique(),
		showPk: integer().references(() => shows.pk, { onDelete: "cascade" }),
		seasonNumber: integer().notNull(),
		startAir: date(),
		endAir: date(),

		externalId: season_extid(),

		createdAt: timestamp({ withTimezone: true, mode: "string" })
			.notNull()
			.defaultNow(),
		nextRefresh: timestamp({ withTimezone: true, mode: "string" }).notNull(),
	},
	(t) => [
		unique().on(t.showPk, t.seasonNumber),
		index("show_fk").using("hash", t.showPk),
	],
);

export const seasonTranslations = schema.table(
	"season_translations",
	{
		pk: integer()
			.notNull()
			.references(() => seasons.pk, { onDelete: "cascade" }),
		language: language().notNull(),
		name: text(),
		description: text(),
		poster: image(),
		thumbnail: image(),
		banner: image(),
	},
	(t) => [primaryKey({ columns: [t.pk, t.language] })],
);
