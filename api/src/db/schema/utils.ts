import { jsonb, pgSchema, varchar } from "drizzle-orm/pg-core";

export const schema = pgSchema("kyoo");

export const language = () => varchar({ length: 255 });

export const image = () =>
	jsonb().$type<{ id: string; source: string; blurhash: string }>();
