import i18next from "i18next";
import AsyncStorageBackend, {
	type AsyncStorageBackendOptions,
} from "i18next-async-storage-backend";
import ChainedBackend, { type ChainedBackendOptions } from "i18next-chained-backend";
import HttpApi, { type HttpBackendOptions } from "i18next-http-backend";
import { getServerData } from "one";
import { type ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";

export const TranslationsProvider = ({ children }: { children: ReactNode }) => {
	const val = useMemo(() => {
		const i18n = i18next.createInstance();
		i18n.use(ChainedBackend).init<ChainedBackendOptions>({
			interpolation: {
				escapeValue: false,
			},
			returnEmptyString: false,
			fallbackLng: "en",
			load: "currentOnly",
			supportedLngs: getServerData("supportedLngs"),
			backend: {
				backends: [AsyncStorageBackend, HttpApi],
				backendOptions: [
					{
						loadPath: "/translations/{{lng}}.json",
					} satisfies HttpBackendOptions,
				],
			},
		});
		i18n.services.resourceStore.data = getServerData("translations");
		return i18n;
	}, []);
	return <I18nextProvider i18n={val}>{children}</I18nextProvider>;
};
