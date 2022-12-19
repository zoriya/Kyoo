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

import "../polyfill";

import { ReactNode, useState } from "react";
import NextApp, { AppContext, type AppProps } from "next/app";
import { createTheme, ThemeProvider as MTheme } from "@mui/material";
import { Hydrate, QueryClientProvider } from "@tanstack/react-query";
import {
	HiddenIfNoJs,
	SkeletonCss,
	ThemeSelector as KThemeSelector,
	WebTooltip,
} from "@kyoo/primitives";
import { createQueryClient, fetchQuery, QueryIdentifier, QueryPage } from "@kyoo/models";
import { useTheme, useMobileHover } from "yoshiki/web";
import { useYoshiki } from "yoshiki/native";
import superjson from "superjson";
import Head from "next/head";
import { withTranslations } from "../i18n";

const ThemeSelector = ({ children }: { children?: ReactNode | ReactNode[] }) => {
	// TODO: Handle user selected mode (light, dark, auto)
	// TODO: Hande theme change.
	return (
		<MTheme theme={createTheme()}>
			<KThemeSelector>{children}</KThemeSelector>
		</MTheme>
	);
};

const GlobalCssTheme = () => {
	const theme = useTheme();

	return (
		<>
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

				#__next {
					height: 100vh;
				}

				.infinite-scroll-component__outerdiv {
					width: 100%;
					height: 100%;
				}
			`}</style>
			<WebTooltip theme={theme} />
			<SkeletonCss />
			<HiddenIfNoJs />
		</>
	);
};

const App = ({ Component, pageProps }: AppProps) => {
	const [queryClient] = useState(() => createQueryClient());
	const { queryState, ...props } = superjson.deserialize<any>(pageProps ?? { json: {} });
	const Layout = (Component as QueryPage).getLayout ?? (({ page }) => page);

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
						<Layout page={<Component {...props} />} />
					</ThemeSelector>
				</Hydrate>
			</QueryClientProvider>
		</>
	);
};

App.getInitialProps = async (ctx: AppContext) => {
	const appProps = await NextApp.getInitialProps(ctx);

	const getUrl = (ctx.Component as QueryPage).getFetchUrls;
	const getLayoutUrl = ((ctx.Component as QueryPage).getLayout as QueryPage)?.getFetchUrls;

	const urls: QueryIdentifier[] = [
		...(getUrl ? getUrl(ctx.router.query as any) : []),
		...(getLayoutUrl ? getLayoutUrl(ctx.router.query as any) : []),
	];
	appProps.pageProps.queryState = await fetchQuery(urls);

	return { pageProps: superjson.serialize(appProps.pageProps) };
};

export default withTranslations(App);
