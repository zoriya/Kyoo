import { FormatRegistry } from "@sinclair/typebox";
import { t } from "elysia";
import { comment } from "../../utils";
import type { KError } from "../error";

export const validateTranslations = <T extends object>(
	translations: Record<string, T>,
): KError | null => {
	for (const lang of Object.keys(translations)) {
		try {
			const valid = new Intl.Locale(lang).baseName;
			if (lang !== valid) {
				translations[valid] = translations[lang];
				delete translations[lang];
			}
		} catch (e) {
			return {
				status: 400,
				message: `Invalid translation name: '${lang}'.`,
				details: null,
			};
		}
	}
	return null;
};

FormatRegistry.Set("language", (lang) => {
	try {
		const normalized = new Intl.Locale(lang).baseName;
		// TODO: we should actually replace the locale with normalized if we managed to parse it but transforms aren't working
		return lang === normalized;
	} catch {
		return false;
	}
});

type StringProps = NonNullable<Parameters<typeof t.String>[0]>;

// TODO: format validation doesn't work in record's key. We should have a proper way to check that.
export const Language = (props?: StringProps) =>
	t.String({
		format: "language",
		description: comment`
			${props?.description ?? ""}
			This is a BCP 47 language code (the IETF Best Current Practices on Tags for Identifying Languages).
			BCP 47 is also known as RFC 5646. It subsumes ISO 639 and is backward compatible with it.
		`,
		error: "Expected a valid (and NORMALIZED) bcp-47 language code.",
		...props,
	});

export const processLanguages = (languages?: string) => {
	if (!languages) return ["*"];
	return languages
		.split(",")
		.map((x) => {
			const [lang, q] = x.trim().split(";q=");
			return [lang, q ? Number.parseFloat(q) : 1] as const;
		})
		.sort(([_, q1], [__, q2]) => q1 - q2)
		.flatMap(([lang]) => {
			const [base, spec] = lang.split("-");
			if (spec) return [lang, base];
			return [lang];
		});
};
