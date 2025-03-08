import { t } from "elysia";
import { comment } from "~/utils";
import { Language } from "./language";

export const Original = t.Object({
	language: Language({
		description: "The language code this was made in.",
		examples: ["ja"]
	}),
	name: t.String({
		description: "The name in the original language",
		examples: ["進撃の巨人"],
	}),
	latinName: t.Nullable(
		t.String({
			description: comment`
				The original name but using latin scripts.
				This is only set if the original language is written with another
				alphabet (like japanase, korean, chineses...)
			`,
			examples: ["Shingeki no Kyojin"],
		}),
	),
});
export type Original = typeof Original.static;
