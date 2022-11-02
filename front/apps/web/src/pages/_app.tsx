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

import React, { ReactNode, useState } from "react";
import appWithI18n from "next-translate/appWithI18n";
import { ThemeProvider, useTheme } from "@emotion/react";
import { createTheme, ThemeProvider as MTheme } from "@mui/material";
import NextApp, { AppContext } from "next/app";
import type { AppProps } from "next/app";
import { Hydrate, QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient, fetchQuery, QueryIdentifier, QueryPage } from "~/utils/query";
import superjson from "superjson";
import Head from "next/head";
import { useMobileHover } from "~/utils/utils";
import { catppuccin } from "~/utils/themes/catppuccin";
import { selectMode } from "~/utils/themes/theme";
import { Toto } from "@kyoo/ui";

// Simply silence a SSR warning (see https://github.com/facebook/react/issues/14927 for more details)
if (typeof window === "undefined") {
	React.useLayoutEffect = React.useEffect;
}

const ThemeSelector = ({ children }: { children?: ReactNode | ReactNode[] }) => {
	// TODO: Handle user selected mode (light, dark, auto)
	// TODO: Hande theme change.
	return (
		<MTheme theme={createTheme()}>
			<ThemeProvider theme={selectMode(catppuccin, "light")}>
				{children}
			</ThemeProvider>
		</MTheme>
	)
}

const GlobalCssTheme = () => {
	const theme = useTheme();

	return (
		<style jsx global>{`
			body {
				margin: 0px;
				padding: 0px;
				background-color: ${theme.background};
			}

			*::-webkit-scrollbar {
				height: 6px;
				width: 6px;
				background: transparent;
			}

			*::-webkit-scrollbar-thumb {
				background-color: #999;
				border-radius: 90px;
			}
			*:hover::-webkit-scrollbar-thumb {
				background-color: rgb(134, 127, 127);
			}
		`}</style>
	);
};

const App = ({ Component, pageProps }: AppProps) => {
	const [queryClient] = useState(() => createQueryClient());
	const { queryState, ...props } = superjson.deserialize<any>(pageProps ?? { json: {} });
	const getLayout = (Component as QueryPage).getLayout ?? ((page) => page);

	useMobileHover();

	return (
		<>
			<Head>
				<title>Kyoo</title>
			</Head>
			<QueryClientProvider client={queryClient}>
				<Hydrate state={queryState}>
					<ThemeSelector>
						<GlobalCssTheme />
						<Toto />
						{getLayout(<Component {...props} />)}
					</ThemeSelector>
				</Hydrate>
			</QueryClientProvider>
		</>
	);
};

App.getInitialProps = async (ctx: AppContext) => {
	const appProps = await NextApp.getInitialProps(ctx);

	const getUrl = (ctx.Component as QueryPage).getFetchUrls;
	const urls: QueryIdentifier[] = getUrl ? getUrl(ctx.router.query as any) : [];
	appProps.pageProps.queryState = await fetchQuery(urls);

	return { pageProps: superjson.serialize(appProps.pageProps) };
};

// The as any is needed since appWithI18n as wrong type hints
export default appWithI18n(App as any, {
	skipInitialProps: false,
	locales: ["en", "fr"],
	defaultLocale: "en",
	loader: false,
	pages: {
		"*": ["common", "browse", "player"],
	},
	loadLocaleFrom: (locale, namespace) =>
		import(`../../locales/${locale}/${namespace}`).then((m) => m.default),
});
