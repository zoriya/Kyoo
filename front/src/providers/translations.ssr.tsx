import { readdirSync } from "node:fs";
import i18next from "i18next";
import FsBackend, { type FsBackendOptions } from "i18next-fs-backend";
import { getServerData, setServerData } from "one";
import { type ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";

export const supportedLanguages = readdirSync(
	new URL("../../public/translations", import.meta.url),
).map((x) => x.replace(".json", ""));

export const TranslationsProvider = ({ children }: { children: ReactNode }) => {
	const val = useMemo(() => {
		const i18n = i18next.createInstance();
		i18n.use(FsBackend).init<FsBackendOptions>({
			interpolation: {
				escapeValue: false,
			},
			returnEmptyString: false,
			fallbackLng: "en",
			load: "currentOnly",
			lng: getServerData("systemLanguage"),
			supportedLngs: supportedLanguages,
			initAsync: false,
			backend: {
				loadPath: `${new URL("../../public/translations", import.meta.url).pathname}/{{lng}}.json`,
			},
		});
		setServerData("supportedLngs", supportedLanguages);
		setServerData("translations", i18n.services.resourceStore.data);
		return i18n;
	}, []);
	return <I18nextProvider i18n={val}>{children}</I18nextProvider>;
};
