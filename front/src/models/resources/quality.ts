import { z } from "zod";

export const QualityP = z
	.union([
		z.literal("original"),
		z.literal("8k"),
		z.literal("4k"),
		z.literal("1440p"),
		z.literal("1080p"),
		z.literal("720p"),
		z.literal("480p"),
		z.literal("360p"),
		z.literal("240p"),
	])
	.default("original");

/**
 * A Video Quality Enum.
 */
export type Quality = z.infer<typeof QualityP>;
