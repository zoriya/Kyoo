import { z } from "zod/v4";

export const zdate = () =>
	z.iso
		.date()
		.or(z.iso.datetime())
		.transform((x) => new Date(x));
