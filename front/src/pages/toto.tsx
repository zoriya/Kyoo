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

import { QueryPage, useFetch } from "~/utils/query";
import useTranslation from "next-translate/useTranslation";

const Toto: QueryPage = ({}) => {
	const libraries = useFetch<any>("libraries");
	const { t } = useTranslation("common");

	if (libraries.error) return <p>oups</p>;
	if (!libraries.data) return <p>loading</p>;

	return (
		<>
			<p>{t("navbar.home")}</p>
			{libraries.data.items.map((x: any) => (
				<p key={x.id}>{x.name}</p>
			))}
		</>
	);
};

Toto.getFetchUrls = () => [["libraries"]];

export default Toto;
