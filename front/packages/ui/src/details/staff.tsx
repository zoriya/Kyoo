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

import { Person, PersonP, QueryIdentifier } from "@kyoo/models";
import { useTranslation } from "react-i18next";
import { InfiniteFetch } from "../fetch-infinite";
import { PersonAvatar } from "./person";

export const Staff = ({ slug }: { slug: string }) => {
	const { t } = useTranslation();

	return (
		<InfiniteFetch
			query={Staff.query(slug)}
			horizontal
			layout={{ numColumns: 1, size: PersonAvatar.width }}
			empty={t("show.staff-none")}
			placeholderCount={20}
		>
			{(item, key) => (
				<PersonAvatar
					key={key}
					isLoading={item.isLoading}
					slug={item?.slug}
					name={item?.name}
					role={item?.type ? `${item?.type} (${item?.role})` : item?.role}
					poster={item?.poster}
					// sx={{ width: { xs: "7rem", lg: "10rem" }, flexShrink: 0, px: 2 }}
				/>
			)}
		</InfiniteFetch>
	);
};

Staff.query = (slug: string): QueryIdentifier<Person> => ({
	parser: PersonP,
	path: ["shows", slug, "people"],
	infinite: true,
});
