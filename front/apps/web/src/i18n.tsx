/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { type ComponentType, useMemo } from "react";
import i18next, { type InitOptions } from "i18next";
import { I18nextProvider } from "react-i18next";
import type { AppContext, AppInitialProps, AppProps } from "next/app";

import en from "../../../translations/en.json";
import fr from "../../../translations/fr.json";
import zh from "../../../translations/zh.json";

export const withTranslations = (
	AppToTranslate: ComponentType<AppProps> & {
		getInitialProps: (ctx: AppContext) => Promise<AppInitialProps>;
	},
) => {
	const i18n = i18next.createInstance();
	const commonOptions: InitOptions = {
		interpolation: {
			escapeValue: false,
		},
	};

	const AppWithTranslations = (props: AppProps) => {
		const li18n = useMemo(() => {
			if (typeof window === "undefined") return i18n;
			i18next.init({
				...commonOptions,
				lng: props.pageProps.__lang,
				resources: props.pageProps.__resources,
			});
			return i18next;
		}, [props.pageProps.__lang, props.pageProps.__resources]);

		return (
			<I18nextProvider i18n={li18n}>
				<AppToTranslate {...props} />
			</I18nextProvider>
		);
	};
	AppWithTranslations.getInitialProps = async (ctx: AppContext) => {
		const props: AppInitialProps = await AppToTranslate.getInitialProps(ctx);
		const lng = ctx.router.locale || ctx.router.defaultLocale || "en";
		// TODO: use a backend to fetch only the needed translations.
		// TODO: use a different backend on the client and fetch needed translations.
		const resources = {
			en: { translation: en },
			fr: { translation: fr },
			zh: { translation: zh },
		};
		await i18n.init({
			...commonOptions,
			lng,
			fallbackLng: ctx.router.defaultLocale || "en",
			resources,
		});
		props.pageProps.__lang = lng;
		props.pageProps.__resources = resources;
		return props;
	};

	return AppWithTranslations;
};
