import { pgSchema, varchar } from "drizzle-orm/pg-core";

export const schema = pgSchema("kyoo");

export const language = () => varchar({ length: 255 });
