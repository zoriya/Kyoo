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

import { HydrationBoundary, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	HiddenIfNoJs,
	TouchOnlyCss,
	SkeletonCss,
	ThemeSelector,
	SnackbarProvider,
} from "@kyoo/primitives";
import { WebTooltip } from "@kyoo/primitives/src/tooltip.web";
import {
	AccountP,
	AccountProvider,
	ConnectionErrorContext,
	createQueryClient,
	fetchQuery,
	getTokenWJ,
	type QueryIdentifier,
	type QueryPage,
	ServerInfoP,
	setSsrApiUrl,
	UserP,
	useUserTheme,
} from "@kyoo/models";
import { type ComponentType, useContext, useState } from "react";
import NextApp, { type AppContext, type AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { useTheme, useMobileHover, useStyleRegistry, StyleRegistryProvider } from "yoshiki/web";
import superjson from "superjson";
import Head from "next/head";
import { withTranslations } from "../i18n";
import arrayShuffle from "array-shuffle";
import { Tooltip } from "react-tooltip";
import { getCurrentAccount, readCookie, updateAccount } from "@kyoo/models/src/account-internal";
import { PortalProvider } from "@gorhom/portal";
import { ConnectionError } from "@kyoo/ui";

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
			<TouchOnlyCss />
			<HiddenIfNoJs />
		</>
	);
};

const YoshikiDebug = ({ children }: { children: JSX.Element }) => {
	if (typeof window === "undefined") return children;
	const registry = useStyleRegistry();
	return <StyleRegistryProvider registry={registry}>{children}</StyleRegistryProvider>;
};

const ConnectionErrorVerifier = ({
	children,
	skipErrors,
}: {
	children: JSX.Element;
	skipErrors?: boolean;
}) => {
	const { error } = useContext(ConnectionErrorContext);

	if (!error || skipErrors) return children;
	return <WithLayout Component={ConnectionError} />;
};

const WithLayout = ({ Component, ...props }: { Component: ComponentType }) => {
	const layoutInfo = (Component as QueryPage).getLayout ?? (({ page }) => page);
	const { Layout, props: layoutProps } =
		typeof layoutInfo === "function" ? { Layout: layoutInfo, props: {} } : layoutInfo;
	return <Layout page={<Component {...props} />} randomItems={[]} {...layoutProps} />;
};

const App = ({ Component, pageProps }: AppProps) => {
	const [queryClient] = useState(() => createQueryClient());
	const { queryState, ssrError, token, randomItems, account, theme, ...props } =
		superjson.deserialize<any>(pageProps ?? { json: {} });
	const userTheme = useUserTheme(theme);
	useMobileHover();

	// Set the auth from the server (if the token was refreshed during SSR).
	if (typeof window !== "undefined" && token) {
		const account = getCurrentAccount();
		if (account) updateAccount(account.id, { ...account, token });
	}

	return (
		<YoshikiDebug>
			<>
				<Head>
					<title>Kyoo</title>
					<meta name="description" content="A portable and vast media library solution." />
				</Head>
				<QueryClientProvider client={queryClient}>
					<AccountProvider ssrAccount={account} ssrError={ssrError}>
						<HydrationBoundary state={queryState}>
							<ThemeSelector theme={userTheme} font={{ normal: "inherit" }}>
								<PortalProvider>
									<SnackbarProvider>
										<GlobalCssTheme />
										<ConnectionErrorVerifier skipErrors={(Component as QueryPage).isPublic}>
											<WithLayout
												Component={Component}
												randomItems={
													randomItems[Component.displayName!] ??
													arrayShuffle((Component as QueryPage).randomItems ?? [])
												}
												{...props}
											/>
										</ConnectionErrorVerifier>
										<Tooltip id="tooltip" positionStrategy={"fixed"} />
									</SnackbarProvider>
								</PortalProvider>
							</ThemeSelector>
						</HydrationBoundary>
					</AccountProvider>
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</>
		</YoshikiDebug>
	);
};

App.getInitialProps = async (ctx: AppContext) => {
	const appProps = await NextApp.getInitialProps(ctx);
	const Component = ctx.Component as QueryPage;

	const items = arrayShuffle(Component.randomItems ?? []);
	appProps.pageProps.randomItems = {
		[Component.displayName!]: items,
	};

	if (typeof window !== "undefined") return { pageProps: superjson.serialize(appProps.pageProps) };

	try {
		const getUrl = Component.getFetchUrls;
		const getLayoutUrl =
			Component.getLayout && "Layout" in Component.getLayout
				? Component.getLayout.Layout.getFetchUrls
				: Component.getLayout?.getFetchUrls;
		const urls: QueryIdentifier[] = [
			...(getUrl ? getUrl(ctx.router.query as any, items) : []),
			...(getLayoutUrl ? getLayoutUrl(ctx.router.query as any, items) : []),
			// always include server info for guest permissions.
			{ path: ["info"], parser: ServerInfoP },
		];

		setSsrApiUrl();

		const account = readCookie(ctx.ctx.req?.headers.cookie, "account", AccountP);
		if (account) urls.push({ path: ["auth", "me"], parser: UserP });
		const [authToken, token, error] = await getTokenWJ(account);
		if (error) appProps.pageProps.ssrError = error;
		else {
			const client = (await fetchQuery(urls, authToken))!;
			appProps.pageProps.queryState = dehydrate(client);
			if (account) {
				appProps.pageProps.token = token;
				appProps.pageProps.account = {
					...client.getQueryData(["auth", "me"]),
					...account,
				};
			}
		}
		appProps.pageProps.theme = readCookie(ctx.ctx.req?.headers.cookie, "theme") ?? "auto";
	} catch (e) {
		console.error("SSR error, disabling it.");
	}
	return { pageProps: superjson.serialize(appProps.pageProps) };
};

export default withTranslations(App);
