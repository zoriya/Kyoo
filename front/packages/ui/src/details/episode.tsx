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

import { focusReset, H6, Image, ImageProps, Link, P, Skeleton, SubP, ts } from "@kyoo/primitives";
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

export const displayRuntime = (runtime: number) => {
	if (runtime < 60) return `${runtime}min`;
	return `${Math.floor(runtime / 60)}h${runtime % 60}`;
};

export const EpisodeBox = ({
	name,
	overview,
	thumbnail,
	isLoading,
	href,
	...props
}: Stylable &
	WithLoading<{
		name: string | null;
		overview: string | null;
		href: string;
		thumbnail?: ImageProps["src"] | null;
	}>) => {
	const { css } = useYoshiki("episodebox");
	const { t } = useTranslation();

	return (
		<Link
			href={href}
			{...css(
				{
					alignItems: "center",
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
			<Image
				src={thumbnail}
				quality="low"
				alt=""
				forcedLoading={isLoading}
				layout={{ width: percent(100), aspectRatio: 16 / 9 }}
				{...(css("poster") as any)}
			/>
			<Skeleton {...css({ width: percent(50) })}>
				{isLoading || (
					<P {...css([{ marginY: 0, textAlign: "center" }, "title"])}>
						{name ?? t("show.episodeNoMetadata")}
					</P>
				)}
			</Skeleton>
			<Skeleton {...css({ width: percent(75), height: rem(0.8) })}>
				{isLoading || (
					<SubP
						numberOfLines={3}
						{...css({
							marginTop: 0,
							textAlign: "center",
						})}
					>
						{overview}
					</SubP>
				)}
			</Skeleton>
		</Link>
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
	runtime,
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
	runtime: number | null;
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
							transform: "scale(1.1)" as any,
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
				<View
					{...css({
						flexGrow: 1,
						flexShrink: 1,
						flexDirection: "row",
						justifyContent: "space-between",
					})}
				>
					<Skeleton>
						{isLoading || (
							<H6 aria-level={undefined} {...css("title")}>
								{name ?? t("show.episodeNoMetadata")}
							</H6>
						)}
					</Skeleton>
					{isLoading ||
						(runtime && <Skeleton>{isLoading || <SubP>{displayRuntime(runtime)}</SubP>}</Skeleton>)}
				</View>
				<Skeleton>{isLoading || <P numberOfLines={3}>{overview}</P>}</Skeleton>
			</View>
		</Link>
	);
};
EpisodeLine.layout = {
	numColumns: 1,
	size: 100,
	layout: "vertical",
	gap: ts(1),
} satisfies Layout;
