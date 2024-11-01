import { jsonb, pgSchema, varchar } from "drizzle-orm/pg-core";

export const schema = pgSchema("kyoo");

export const language = () => varchar({ length: 255 });

export const image = () =>
	jsonb().$type<{ source: string; blurhash: string }>();

export const externalid = () =>
	jsonb()
		.$type<
			Record<
				string,
				{
					dataId: string;
					link: string | null;
				}
			>
		>()
		.notNull()
		.default({});
