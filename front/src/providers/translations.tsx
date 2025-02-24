import i18next from "i18next";
import ChainedBackend, { type ChainedBackendOptions } from "i18next-chained-backend";
import HttpApi, { type HttpBackendOptions } from "i18next-http-backend";
import { getServerData } from "one";
import type { RefObject } from "react";
import { type ReactNode, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { storage } from "./settings";

class Backend {
	private url: RefObject<string | null>;
	static type = "backend" as const;

	constructor(_services: any, opts: { url: RefObject<string | null> }) {
		this.url = opts.url;
	}

	init(_services: any, opts: { url: RefObject<string | null> }) {
		this.url = opts.url;
	}

	async read(language: string, namespace: string) {
		const key = `translation.${namespace}.${language}`;
		const cached = storage.getString(key);
		if (cached) return JSON.parse(cached);
		const ghUrl = "https://raw.githubusercontent.com/zoriya/Kyoo/refs/heads/master/front/public";
		const data = await fetch(`${this.url.current ?? ghUrl}/translations/${language}.json`);
		storage.set(key, JSON.stringify(await data.json()));
		return data;
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
			supportedLngs: getServerData("supportedLngs"),
			backend: {
				url,
			},
		});
		return i18n;
	}, []);
	return <I18nextProvider i18n={val}>{children}</I18nextProvider>;
};
