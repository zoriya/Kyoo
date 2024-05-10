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

import { type WatchInfo, getCurrentApiUrl, queryFn, toQueryKey } from "@kyoo/models";
import { Player } from "../player";
import { getCurrentAccount } from "@kyoo/models/src/account-internal";
import type { ReactNode } from "react";

export const useDownloader = () => {
	return async (type: "episode" | "movie", slug: string) => {
		const account = getCurrentAccount();
		const query = Player.infoQuery(type, slug);
		const info: WatchInfo = await queryFn(
			{
				queryKey: toQueryKey(query),
				signal: undefined as any,
				meta: undefined,
				apiUrl: account?.apiUrl,
			},
			query.parser,
			account?.token.access_token,
		);

		// TODO: This methods does not work with auth.
		const a = document.createElement("a");
		a.style.display = "none";
		a.href = `${getCurrentApiUrl()!}/${type}/${slug}/direct`;
		a.download = `${slug}.${info.extension}`;
		document.body.appendChild(a);
		a.click();
	};
};

export const DownloadPage = () => {};
export const DownloadProvider = ({ children }: { children: ReactNode }) => children;
