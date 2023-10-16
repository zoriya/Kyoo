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

import { Hydrate, QueryClientProvider } from "@tanstack/react-query";
import { HiddenIfNoJs, SkeletonCss, ThemeSelector } from "@kyoo/primitives";
import { WebTooltip } from "@kyoo/primitives/src/tooltip.web";
import {
	createQueryClient,
	fetchQuery,
	getTokenWJ,
	QueryIdentifier,
	QueryPage,
} from "@kyoo/models";
import { setSecureItem } from "@kyoo/models/src/secure-store.web";
import { useState } from "react";
import NextApp, { AppContext, type AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { useTheme, useMobileHover, useStyleRegistry, StyleRegistryProvider } from "yoshiki/web";
import superjson from "superjson";
import Head from "next/head";
import { withTranslations } from "../i18n";
import arrayShuffle from "array-shuffle";

const font = Poppins({ weight: ["300", "400", "900"], subsets: ["latin"], display: "swap" });

const GlobalCssTheme = () => {
	const theme = useTheme();
	return (
		<>
			<style jsx global>{`
				body {
					margin: 0px;
					padding: 0px;
					overflow: "hidden";
					background-color: ${theme.background};
					font-family: ${font.style.fontFamily};
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

				::cue {
					background-color: transparent;
					text-shadow:
						-1px -1px 0 #000,
						1px -1px 0 #000,
						-1px 1px 0 #000,
						1px 1px 0 #000;
				}
			`}</style>
			<WebTooltip theme={theme} />
			<SkeletonCss />
			<HiddenIfNoJs />
		</>
	);
};

const YoshikiDebug = ({ children }: { children: JSX.Element }) => {
	if (typeof window === "undefined") return children;
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const registry = useStyleRegistry();
	return <StyleRegistryProvider registry={registry}>{children}</StyleRegistryProvider>;
};

const App = ({ Component, pageProps }: AppProps) => {
	const [queryClient] = useState(() => createQueryClient());
	const { queryState, token, randomItems, ...props } = superjson.deserialize<any>(
		pageProps ?? { json: {} },
	);
	const layoutInfo = (Component as QueryPage).getLayout ?? (({ page }) => page);
	const { Layout, props: layoutProps } =
		typeof layoutInfo === "function" ? { Layout: layoutInfo, props: {} } : layoutInfo;

	useMobileHover();

	// Set the auth from the server (if the token was refreshed during SSR).
	if (typeof window !== "undefined" && token) setSecureItem("auth", JSON.stringify(token));

	return (
		<YoshikiDebug>
			<>
				<Head>
					<title>Kyoo</title>
				</Head>
				<QueryClientProvider client={queryClient}>
					<Hydrate state={queryState}>
						<ThemeSelector theme="auto" font={{ normal: "inherit" }}>
							<GlobalCssTheme />
							<Layout
								page={
									<Component
										randomItems={
											randomItems[Component.displayName!] ??
											arrayShuffle((Component as QueryPage).randomItems ?? [])
										}
										{...props}
									/>
								}
								randomItems={[]}
								{...layoutProps}
							/>
						</ThemeSelector>
					</Hydrate>
				</QueryClientProvider>
			</>
		</YoshikiDebug>
	);
};

App.getInitialProps = async (ctx: AppContext) => {
	const appProps = await NextApp.getInitialProps(ctx);
	const Component = ctx.Component as QueryPage;

	const getUrl = Component.getFetchUrls;
	const getLayoutUrl =
		Component.getLayout && "Layout" in Component.getLayout
			? Component.getLayout.Layout.getFetchUrls
			: Component.getLayout?.getFetchUrls;

	const urls: QueryIdentifier[] = [
		...(getUrl ? getUrl(ctx.router.query as any) : []),
		...(getLayoutUrl ? getLayoutUrl(ctx.router.query as any) : []),
	];
	const [authToken, token] = await getTokenWJ(ctx.ctx.req?.headers.cookie);
	appProps.pageProps.queryState = await fetchQuery(urls, authToken);
	appProps.pageProps.token = token;
	appProps.pageProps.randomItems = {
		[Component.displayName!]: arrayShuffle(Component.randomItems ?? []),
	};

	return { pageProps: superjson.serialize(appProps.pageProps) };
};

export default withTranslations(App);
