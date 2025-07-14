import i18next from "i18next";
import HttpApi, { type HttpBackendOptions } from "i18next-http-backend";
import { type ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { getServerData } from "~/utils";
import { supportedLanguages } from "./translations.compile";

export const TranslationsProvider = ({ children }: { children: ReactNode }) => {
	const val = useMemo(() => {
		const i18n = i18next.createInstance();
		// 	TODO: use https://github.com/i18next/i18next-browser-languageDetector
		i18n.use(HttpApi).init<HttpBackendOptions>({
			interpolation: {
				escapeValue: false,
			},
			returnEmptyString: false,
			fallbackLng: "en",
			load: "currentOnly",
			supportedLngs: supportedLanguages,
			// we don't need to cache resources since we always get a fresh one from ssr
			backend: {
				loadPath: "/translations/{{lng}}.json",
			},
		});
		i18n.services.resourceStore.data = getServerData("translations");
		return i18n;
	}, []);
	return <I18nextProvider i18n={val}>{children}</I18nextProvider>;
};
