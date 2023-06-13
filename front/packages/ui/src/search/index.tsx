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

import { LibraryItem, LibraryItemP, QueryIdentifier, QueryPage } from "@kyoo/models";
import { useTranslation } from "react-i18next";
import { ItemGrid } from "../browse/grid";
import { itemMap } from "../browse/index";
import { EmptyView } from "../fetch";
import { InfiniteFetch } from "../fetch-infinite";
import { DefaultLayout } from "../layout";

const query = (query: string): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["search", query, "items"],
	infinite: true,
	getNext: () => undefined,
});

export const SearchPage: QueryPage<{ q?: string }> = ({ q }) => {
	const { t } = useTranslation();

	const empty = <EmptyView message={t("search.empty")} />;
	if (!q) return empty;
	return (
		<InfiniteFetch
			query={query(q)}
			// TODO: Understand why it does not work.
			incremental={true}
			layout={ItemGrid.layout}
			placeholderCount={15}
			empty={empty}
		>
			{(item) => <ItemGrid {...itemMap(item)} />}
		</InfiniteFetch>
	);
};

SearchPage.getLayout = DefaultLayout;
SearchPage.getFetchUrls = ({ q }) => (q ? [query(q)] : []);
