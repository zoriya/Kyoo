import i18next from "i18next";
import { type ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { setServerData } from "~/utils";
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
		// store data for the browser
		setServerData("translations", i18n.services.resourceStore.data);
		return i18n;
	}, []);
	return <I18nextProvider i18n={val}>{children}</I18nextProvider>;
};
