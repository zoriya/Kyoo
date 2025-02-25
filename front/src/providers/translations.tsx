import i18next from "i18next";
import { type ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { resources, supportedLanguages } from "./translations.compile";

export const TranslationsProvider = ({ children }: { children: ReactNode }) => {
	const val = useMemo(() => {
		const i18n = i18next.createInstance();
		i18n.init({
			interpolation: {
				escapeValue: false,
			},
			returnEmptyString: false,
			fallbackLng: "en",
			load: "currentOnly",
			supportedLngs: supportedLanguages,
			resources: resources,
		});
		return i18n;
	}, []);
	return <I18nextProvider i18n={val}>{children}</I18nextProvider>;
};
