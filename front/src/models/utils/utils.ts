import { z } from "zod/v4";

export const zdate = () =>
	z.iso
		.date()
		.or(z.iso.datetime())
		.transform((x) => new Date(x));

export const typed = <T>(Base: new () => object) =>
	Base as unknown as new () => T;
