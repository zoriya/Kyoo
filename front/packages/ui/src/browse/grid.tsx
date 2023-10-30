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
import { ImageStyle } from "react-native";
import { percent, px, Stylable, Theme, useYoshiki } from "yoshiki/native";
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
			href={href}
			{...css(
				{
					flexDirection: "column",
					alignItems: "center",
					width: percent(100),
					child: {
						poster: {
							borderColor: (theme) => theme.background,
							borderWidth: ts(0.5),
							borderStyle: "solid",
						},
					},
					fover: {
						self: focusReset,
						poster: {
							borderColor: (theme: Theme) => theme.accent,
						},
						title: {
							textDecorationLine: "underline",
						},
					},
				},
				props,
			)}
		>
			<Poster
				src={poster}
				alt={name}
				quality="low"
				forcedLoading={isLoading}
				layout={{ width: percent(100) }}
				{...(css("poster") as { style: ImageStyle })}
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
	numColumns: { xs: 3, sm: 4, md: 5, lg: 6, xl: 8 },
	gap: { xs: ts(1), sm: ts(2), md: ts(4) },
	layout: "grid",
} satisfies Layout;
