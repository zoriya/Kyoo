import { jsonb, pgSchema, varchar } from "drizzle-orm/pg-core";
import type { Image } from "~/models/utils";

export const schema = pgSchema("kyoo");

export const language = () => varchar({ length: 255 });

export const image = () => jsonb().$type<Image>();

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
