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

import { focusReset, H6, Image, ImageProps, Link, P, Skeleton, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { ImageStyle, View } from "react-native";
import { Layout, WithLoading } from "../fetch";
import { percent, px, rem, Stylable, Theme, useYoshiki } from "yoshiki/native";
import { KyooImage } from "@kyoo/models";

export const episodeDisplayNumber = (
	episode: {
		seasonNumber?: number | null;
		episodeNumber?: number | null;
		absoluteNumber?: number | null;
	},
	def?: string,
) => {
	if (typeof episode.seasonNumber === "number" && typeof episode.episodeNumber === "number")
		return `S${episode.seasonNumber}:E${episode.episodeNumber}`;
	if (episode.absoluteNumber) return episode.absoluteNumber.toString();
	return def;
};

export const EpisodeBox = ({
	name,
	overview,
	thumbnail,
	isLoading,
	...props
}: Stylable &
	WithLoading<{
		name: string | null;
		overview: string;
		thumbnail?: ImageProps["src"] | null;
	}>) => {
	const { t } = useTranslation();

	return (
		<View {...props}>
			<Image
				src={thumbnail}
				quality="low"
				alt=""
				layout={{ width: percent(100), aspectRatio: 16 / 9 }}
			/>
			<Skeleton>{isLoading || <P>{name ?? t("show.episodeNoMetadata")}</P>}</Skeleton>
			<Skeleton>{isLoading || <P>{overview}</P>}</Skeleton>
		</View>
	);
};

export const EpisodeLine = ({
	slug,
	displayNumber,
	name,
	thumbnail,
	overview,
	isLoading,
	id,
	absoluteNumber,
	episodeNumber,
	seasonNumber,
	releaseDate,
	...props
}: WithLoading<{
	slug: string;
	displayNumber: string;
	name: string | null;
	overview: string | null;
	thumbnail?: KyooImage | null;
	absoluteNumber: number | null;
	episodeNumber: number | null;
	seasonNumber: number | null;
	releaseDate: Date | null;
	id: number;
}> &
	Stylable) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Link
			href={slug ? `/watch/${slug}` : ""}
			{...css(
				{
					m: ts(1),
					alignItems: "center",
					flexDirection: "row",
					child: {
						poster: {
							borderColor: "transparent",
							borderWidth: px(4),
						},
					},
					focus: {
						self: focusReset,
						poster: {
							transform: [{ scale: 1.1 }],
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
			<P {...css({ width: rem(4), flexShrink: 0, m: ts(1), textAlign: "center" })}>
				{isLoading ? <Skeleton variant="filltext" /> : displayNumber}
			</P>
			<Image
				src={thumbnail}
				quality="low"
				alt=""
				layout={{
					width: percent(18),
					aspectRatio: 16 / 9,
				}}
				{...(css(["poster", { flexShrink: 0, m: ts(1) }]) as { style: ImageStyle })}
			/>
			<View {...css({ flexGrow: 1, flexShrink: 1, m: ts(1) })}>
				<Skeleton>
					{isLoading || (
						<H6 aria-level={undefined} {...css("title")}>
							{name ?? t("show.episodeNoMetadata")}
						</H6>
					)}
				</Skeleton>
				<Skeleton>{isLoading || <P numberOfLines={3}>{overview}</P>}</Skeleton>
			</View>
		</Link>
	);
};
EpisodeLine.layout = {
	numColumns: 1,
	size: 100,
} satisfies Layout;
