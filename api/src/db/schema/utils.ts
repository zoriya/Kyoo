import { customType, jsonb, pgSchema, varchar } from "drizzle-orm/pg-core";
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

export const timestamp = customType<{
	data: string;
	driverData: string;
	config: { withTimezone: boolean; precision?: number; mode: "iso" };
}>({
	dataType(config) {
		const precision = config?.precision ? ` (${config.precision})` : "";
		return `timestamp${precision}${config?.withTimezone ? " with time zone" : ""}`;
	},
	fromDriver(value: string): string {
		if (!value) return value;
		// postgres format: 2025-06-22 16:13:37.489301+00
		// what we want:    2025-06-22T16:13:37Z
		return `${value.substring(0, 10)}T${value.substring(11, 19)}Z`;
	},
});
