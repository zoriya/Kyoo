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

import { KyooImage } from "@kyoo/models";
import { Link, Skeleton, Poster, ts, focusReset, P, SubP } from "@kyoo/primitives";
import { Platform } from "react-native";
import { percent, px, Stylable, useYoshiki } from "yoshiki/native";
import { Layout, WithLoading } from "../fetch";

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
	poster?: KyooImage | null;
}> &
	Stylable<"text">) => {
	const { css } = useYoshiki("grid");

	return (
		<Link
			href={href ?? ""}
			{...css(
				[
					{
						flexDirection: "column",
						alignItems: "center",
						m: { xs: ts(1), sm: ts(4) },
						child: {
							poster: {
								borderColor: theme => theme.background,
								borderWidth: px(4),
							},
						},
						fover: {
							self: focusReset,
							poster: {
								borderColor: (theme) => theme.accent,
							},
							title: {
								textDecorationLine: "underline",
							},
						},
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
			<Poster
				src={poster}
				alt={name}
				quality="low"
				isLoading={isLoading}
				layout={{ width: percent(100) }}
				{...css("poster")}
			/>
			<Skeleton>
				{isLoading || (
					<P numberOfLines={1} {...css([{ marginY: 0, textAlign: "center" }, "title"])}>
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

ItemGrid.layout = {
	size: px(150),
	numColumns: { xs: 3, sm: 5, xl: 7 },
} satisfies Layout;
