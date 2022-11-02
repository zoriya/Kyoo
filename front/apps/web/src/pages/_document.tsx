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

import { Html, Main, Head, NextScript } from "next/document";
import { Children } from "react";
import { AppRegistry } from "react-native";

export const style = `
/**
 * Building on the RNWeb reset:
 * https://github.com/necolas/react-native-web/blob/master/packages/react-native-web/src/exports/StyleSheet/initialRules.js
 */
html, body, #__next {
  width: 100%;
  /* To smooth any scrolling behavior */
  -webkit-overflow-scrolling: touch;
  margin: 0px;
  padding: 0px;
  /* Allows content to fill the viewport and go beyond the bottom */
  min-height: 100%;
}
#__next {
  flex-shrink: 0;
  flex-basis: auto;
  flex-direction: column;
  flex-grow: 1;
  display: flex;
  flex: 1;
}
html {
  scroll-behavior: smooth;
  /* Prevent text size change on orientation change https://gist.github.com/tfausak/2222823#file-ios-8-web-app-html-L138 */
  -webkit-text-size-adjust: 100%;
  height: 100%;
}
body {
  display: flex;
  /* Allows you to scroll below the viewport; default value is visible */
  overflow-y: auto;
  overscroll-behavior-y: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -ms-overflow-style: scrollbar;
}
`;

const Document = () => {
	return (
		<Html>
			<Head>
				<link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
				<link rel="icon" type="image/png" sizes="64x64" href="/icon-64x64.png" />
				<link rel="icon" type="image/png" sizes="128x128" href="/icon-128x128.png" />
				<link rel="icon" type="image/png" sizes="256x256" href="/icon-256x256.png" />
			</Head>
			<body className="hoverEnabled">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
};

// Enables SSR for react-native-web styles.
Document.getInitialProps = async ({ renderPage }: any) => {
	AppRegistry.registerComponent("Main", () => Main);
	// @ts-ignore
	const { getStyleElement } = AppRegistry.getApplication("Main");
	const page = await renderPage();
	const styles = [<style dangerouslySetInnerHTML={{ __html: style }} />, getStyleElement()];
	return { ...page, styles: Children.toArray(styles) };
};

export default Document;
