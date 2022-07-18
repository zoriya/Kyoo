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

import { useState } from "react";
import appWithI18n from "next-translate/appWithI18n";
import { ThemeProvider } from "@mui/material";
import NextApp, { AppContext } from "next/app";
import type { AppProps } from "next/app";
import { Hydrate, QueryClientProvider } from "react-query";
import { createQueryClient, fetchQuery } from "~/utils/query";
import { defaultTheme } from "~/utils/themes/default-theme";
import { Navbar } from "~/components/navbar";
import "../global.css"

const App = ({ Component, pageProps }: AppProps) => {
	const [queryClient] = useState(() => createQueryClient());
	return (
		<QueryClientProvider client={queryClient}>
			<Hydrate state={pageProps.queryState}>
				<ThemeProvider theme={defaultTheme}>
					<Navbar />
					{/* TODO: add a container to allow the component to be scrolled without the navbar */}
					{/* TODO: add an option to disable the navbar in the component */}
					<Component {...pageProps} />
				</ThemeProvider>
			</Hydrate>
		</QueryClientProvider>
	);
};

App.getInitialProps = async (ctx: AppContext) => {
	const appProps = await NextApp.getInitialProps(ctx);

	const getUrl = (ctx.Component as any).getFetchUrls;
	const urls: [[string]] = getUrl ? getUrl(ctx.router.query) : [];
	// TODO: check if the navbar is needed for this
	urls.push(["libraries"]);
	appProps.pageProps.queryState = await fetchQuery(urls);

	return appProps;
};

// The as any is needed since appWithI18n as wrong type hints
export default appWithI18n(App as any, {
	skipInitialProps: false,
	locales: ["en", "fr"],
	defaultLocale: "en",
	loader: false,
	pages: {
		"*": ["common"],
	},
	loadLocaleFrom: (locale, namespace) =>
		import(`../../locales/${locale}/${namespace}`).then((m) => m.default),
});
