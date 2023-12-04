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

import { KyooImage, WatchStatusV } from "@kyoo/models";
import {
	Link,
	P,
	Skeleton,
	ts,
	ImageBackground,
	Poster,
	Heading,
	Icon,
	PosterBackground,
} from "@kyoo/primitives";
import { useState } from "react";
import { View } from "react-native";
import { percent, px, rem, useYoshiki } from "yoshiki/native";
import { Layout, WithLoading } from "../fetch";
import Done from "@material-symbols/svg-400/rounded/done-fill.svg";

export const ItemList = ({
	href,
	name,
	subtitle,
	thumbnail,
	poster,
	isLoading,
	watchStatus,
	unseenEpisodesCount,
	...props
}: WithLoading<{
	href: string;
	name: string;
	subtitle?: string;
	poster?: KyooImage | null;
	thumbnail?: KyooImage | null;
	watchStatus: WatchStatusV | null;
	unseenEpisodesCount: number | null;
}>) => {
	const { css } = useYoshiki();
	const [isHovered, setHovered] = useState(0);

	return (
		<ImageBackground
			src={thumbnail}
			alt={name}
			quality="medium"
			as={Link}
			href={href ?? ""}
			onFocus={() => setHovered((i) => i + 1)}
			onBlur={() => setHovered((i) => i - 1)}
			onPressIn={() => setHovered((i) => i + 1)}
			onPressOut={() => setHovered((i) => i - 1)}
			containerStyle={{
				borderRadius: px(6),
			}}
			imageStyle={{
				borderRadius: px(6),
			}}
			{...css(
				{
					alignItems: "center",
					justifyContent: "space-evenly",
					flexDirection: "row",
					height: ItemList.layout.size,
					borderRadius: px(6),
					marginX: ItemList.layout.gap,
				},
				props,
			)}
		>
			<View
				{...css({
					flexDirection: "column",
					width: { xs: "50%", lg: "30%" },
				})}
			>
				<Skeleton {...css({ height: rem(2), alignSelf: "center" })}>
					{isLoading || (
						<Heading
							{...css({
								textAlign: "center",
								fontSize: rem(2),
								letterSpacing: rem(0.002),
								fontWeight: "900",
								textTransform: "uppercase",
								textDecorationLine: isHovered ? "underline" : "none",
							})}
						>
							{name}
						</Heading>
					)}
				</Skeleton>
				{(isLoading || subtitle) && (
					<Skeleton {...css({ width: rem(5), alignSelf: "center" })}>
						{isLoading || (
							<P
								{...css({
									textAlign: "center",
								})}
							>
								{subtitle}
							</P>
						)}
					</Skeleton>
				)}
			</View>
			<PosterBackground
				src={poster}
				alt=""
				quality="low"
				forcedLoading={isLoading}
				layout={{ height: percent(80) }}
			>
				{(watchStatus === WatchStatusV.Completed || unseenEpisodesCount) && (
					<View
						{...css({
							position: "absolute",
							top: 0,
							left: 0,
							minWidth: ts(3.5),
							aspectRatio: 1,
							justifyContent: "center",
							m: ts(0.5),
							pX: ts(0.5),
							bg: (theme) => theme.darkOverlay,
							borderRadius: 999999,
						})}
					>
						{watchStatus === WatchStatusV.Completed ? (
							<Icon icon={Done} size={16} />
						) : (
							<P {...css({ m: 0, textAlign: "center" })}>{unseenEpisodesCount}</P>
						)}
					</View>
				)}
			</PosterBackground>
		</ImageBackground>
	);
};

ItemList.layout = { numColumns: 1, size: 300, layout: "vertical", gap: ts(2) } satisfies Layout;
