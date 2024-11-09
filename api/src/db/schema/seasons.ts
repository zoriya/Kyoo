import {
	date,
	integer,
	jsonb,
	primaryKey,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { image, language, schema } from "./utils";
import { shows } from "./shows";

export const entryid = () =>
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

		externalId: entryid(),

		createdAt: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
		nextRefresh: timestamp({ withTimezone: true, mode: "string" }),
	},
	(t) => [unique().on(t.showPk, t.seasonNumber)],
);

export const seasonTranslation = schema.table(
	"season_translation",
	{
		pk: integer()
			.notNull()
			.references(() => seasons.pk, { onDelete: "cascade" }),
		language: language().notNull(),
		name: text(),
		description: text(),
		poster: image(),
		thumbnail: image(),
		logo: image(),
		banner: image(),
	},
	(t) => [primaryKey({ columns: [t.pk, t.language] })],
);
