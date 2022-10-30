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

export default Document;
