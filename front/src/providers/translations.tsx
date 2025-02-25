import * as fs from "expo-file-system";
import i18next from "i18next";
import { type ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";

export const supportedLanguages = (
	await fs.readDirectoryAsync(`${fs.bundleDirectory}/translations/`)
).map((x) => x.replace(".json", ""));

class Backend {
	static type = "backend" as const;

	async read(language: string, _namespace: string) {
		return await fs.readAsStringAsync(`${fs.bundleDirectory}/translations/${language}.json`);
	}
}

export const TranslationsProvider = ({ children }: { children: ReactNode }) => {
	const val = useMemo(() => {
		const i18n = i18next.createInstance();
		i18n.use(Backend).init({
			interpolation: {
				escapeValue: false,
			},
			returnEmptyString: false,
			fallbackLng: "en",
			load: "currentOnly",
			supportedLngs: supportedLanguages,
		});
		return i18n;
	}, []);
	return <I18nextProvider i18n={val}>{children}</I18nextProvider>;
};
