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

export {}
// export const ShowStaff = ({ slug }: { slug: string }) => {
// 	const { items, isError, error } = useInfiniteFetch(ShowStaff.query(slug));
// 	const { t } = useTranslation("browse");

// 	// TODO: handle infinite scroll

// 	if (isError) return <ErrorComponent {...error} />;

// 	return (
// 		<HorizontalList title={t("show.staff")} noContent={t("show.staff-none")}>
// 			{(items ?? [...Array(20)]).map((x, i) => (
// 				<PersonAvatar
// 					key={x ? x.id : i}
// 					person={x}
// 					sx={{ width: { xs: "7rem", lg: "10rem" }, flexShrink: 0, px: 2 }}
// 				/>
// 			))}
// 		</HorizontalList>
// 	);
// };

// ShowStaff.query = (slug: string): QueryIdentifier<Person> => ({
// 	parser: PersonP,
// 	path: ["shows", slug, "people"],
// 	infinite: true,
// });
