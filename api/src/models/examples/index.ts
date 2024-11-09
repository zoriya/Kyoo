import type { TSchema } from "elysia";

export const registerExamples = <T extends TSchema>(
	schema: T,
	...examples: (T["static"] | undefined)[]
) => {
	if ("anyOf" in schema) {
		for (const union of schema.anyOf) {
			registerExamples(union, ...examples);
		}
		return;
	}
	if ("allOf" in schema) {
		for (const intersec of schema.allOf) {
			registerExamples(intersec, ...examples);
		}
		return;
	}
	for (const example of examples) {
		if (!example) continue;
		for (const [key, val] of Object.entries(example)) {
			const prop = schema.properties[
				key as keyof typeof schema.properties
			] as TSchema;
			if (!prop) continue;
			prop.examples ??= [];
			prop.examples.push(val);
		}
	}
};

export { bubble } from "./bubble";
export { madeInAbyss } from "./made-in-abyss";
