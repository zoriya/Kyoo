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

import { Link, Skeleton, Poster, ts, P, SubP } from "@kyoo/primitives";
import { Platform } from "react-native";
import { percent, px, Stylable, useYoshiki } from "yoshiki/native";
import { WithLoading } from "../fetch";

export const ItemGrid = ({
	href,
	name,
	subtitle,
	poster,
	isLoading,
	...props
}: WithLoading<{
	href: string;
	name: string;
	subtitle?: string;
	poster?: string | null;
}> &
	Stylable<"text">) => {
	const { css } = useYoshiki();

	return (
		<Link
			href={href ?? ""}
			{...css(
				[
					{
						flexDirection: "column",
						alignItems: "center",
						m: { xs: ts(1), sm: ts(2) },
					},
					// We leave no width on native to fill the list's grid.
					Platform.OS === "web" && {
						width: { xs: percent(18), sm: percent(25) },
						minWidth: { xs: px(90), sm: px(120) },
						maxWidth: px(168),
					},
				],
				props,
			)}
		>
			<Poster src={poster} alt={name} isLoading={isLoading} layout={{ width: percent(100) }} />
			<Skeleton>
				{isLoading || (
					<P numberOfLines={1} {...css({ marginY: 0, textAlign: "center" })}>
						{name}
					</P>
				)}
			</Skeleton>
			{(isLoading || subtitle) && (
				<Skeleton {...css({ width: percent(50) })}>
					{isLoading || (
						<SubP
							{...css({
								marginTop: 0,
								textAlign: "center",
							})}
						>
							{subtitle}
						</SubP>
					)}
				</Skeleton>
			)}
		</Link>
	);
};

ItemGrid.height = px(250);
