import {
	FormatRegistry,
	type StaticDecode,
	type TSchema,
	type TString,
} from "@sinclair/typebox";
import { t } from "elysia";
import { comment } from "../../utils";
import { KErrorT } from "../error";

// this is just for the doc
FormatRegistry.Set("language", () => true);

export const Language = (props?: NonNullable<Parameters<typeof t.String>[0]>) =>
	t
		.Transform(
			t.String({
				format: "language",
				description: comment`
					${props?.description ?? ""}
					This is a BCP 47 language code (the IETF Best Current Practices on Tags for Identifying Languages).
					BCP 47 is also known as RFC 5646. It subsumes ISO 639 and is backward compatible with it.
				`,
				error: "Expected a valid (and NORMALIZED) bcp-47 language code.",
				...props,
			}),
		)
		.Decode((lang) => {
			try {
				return new Intl.Locale(lang).baseName;
			} catch {
				throw new KErrorT(`Invalid language name: '${lang}'`);
			}
		})
		.Encode((x) => x);

export const TranslationRecord = <T extends TSchema>(
	values: Parameters<typeof t.Record<TString, T>>[1],
	props?: Parameters<typeof t.Record<TString, T>>[2],
) =>
	t
		.Transform(t.Record(t.String(), values, { minPropreties: 1, ...props }))
		// @ts-expect-error idk why the translations type can't get resolved so it's a pain to work
		// with without casting it
		.Decode((translations: Record<string, StaticDecode<T>>) => {
			for (const lang of Object.keys(translations)) {
				try {
					const locale = new Intl.Locale(lang);

					// fallback (ex add `en` if we only have `en-us`)
					if (!(locale.language in translations))
						translations[locale.language] = translations[lang];
					// normalize locale names (caps, old values etc)
					// we need to do this here because the record's key (Language)'s transform is not run.
					// this is a limitation of typebox
					if (lang !== locale.baseName) {
						translations[locale.baseName] = translations[lang];
						delete translations[lang];
					}
				} catch (e) {
					throw new KErrorT(`Invalid translation name: '${lang}'.`);
				}
			}
			return translations;
		})
		.Encode((x) => x);

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

export const AcceptLanguage = ({
	autoFallback = false,
}: { autoFallback?: boolean } = {}) =>
	t.String({
		default: "*",
		example: "en-us, ja;q=0.5",
		description:
			comment`
			List of languages you want the data in.
			This follows the [Accept-Language offical specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language).
		` + autoFallback
				? comment`

			In this request, * is always implied (if no language could satisfy the request, kyoo will use any language available.)
		`
				: "",
	});
