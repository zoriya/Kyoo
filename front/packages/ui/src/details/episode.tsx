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

import {
	focusReset,
	H6,
	IconButton,
	ImageBackground,
	type ImageProps,
	important,
	Link,
	P,
	Skeleton,
	SubP,
	tooltip,
	ts,
} from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { type ImageStyle, Platform, type PressableProps, View } from "react-native";
import type { Layout, WithLoading } from "../fetch";
import { percent, rem, type Stylable, type Theme, useYoshiki } from "yoshiki/native";
import { type KyooImage, WatchStatusV } from "@kyoo/models";
import { ItemProgress } from "../browse/grid";
import { EpisodesContext } from "../components/context-menus";
import { useState } from "react";
import ExpandMore from "@material-symbols/svg-400/rounded/expand_more-fill.svg";
import ExpandLess from "@material-symbols/svg-400/rounded/expand_less-fill.svg";

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

export const displayRuntime = (runtime: number | null) => {
	if (!runtime) return null;
	if (runtime < 60) return `${runtime}min`;
	return `${Math.floor(runtime / 60)}h${runtime % 60}`;
};

export const EpisodeBox = ({
	slug,
	showSlug,
	name,
	overview,
	thumbnail,
	isLoading,
	href,
	watchedPercent,
	watchedStatus,
	...props
}: Stylable &
	WithLoading<{
		slug: string;
		// if show slug is null, disable "Go to show" in the context menu
		showSlug: string | null;
		name: string | null;
		overview: string | null;
		href: string;
		thumbnail?: ImageProps["src"] | null;
		watchedPercent: number | null;
		watchedStatus: WatchStatusV | null;
	}>) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const { css } = useYoshiki("episodebox");
	const { t } = useTranslation();

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			{...css(
				{
					alignItems: "center",
					child: {
						poster: {
							borderColor: (theme) => theme.background,
							borderWidth: ts(0.5),
							borderStyle: "solid",
						},
						more: {
							opacity: 0,
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
						more: {
							opacity: 1,
						},
					},
				},
				props,
			)}
		>
			<ImageBackground
				src={thumbnail}
				quality="low"
				alt=""
				gradient={false}
				hideLoad={false}
				forcedLoading={isLoading}
				layout={{ width: percent(100), aspectRatio: 16 / 9 }}
				{...(css("poster") as any)}
			>
				{(watchedPercent || watchedStatus === WatchStatusV.Completed) && (
					<ItemProgress watchPercent={watchedPercent ?? 100} />
				)}
				{slug && watchedStatus !== undefined && (
					<EpisodesContext
						slug={slug}
						showSlug={showSlug}
						status={watchedStatus}
						isOpen={moreOpened}
						setOpen={(v) => setMoreOpened(v)}
						{...css([
							{
								position: "absolute",
								top: 0,
								right: 0,
								bg: (theme) => theme.darkOverlay,
							},
							"more",
							Platform.OS === "web" && moreOpened && { display: important("flex") },
						])}
					/>
				)}
			</ImageBackground>
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
	showSlug,
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
	watchedPercent,
	watchedStatus,
	href,
	...props
}: WithLoading<{
	id: string;
	slug: string;
	// if show slug is null, disable "Go to show" in the context menu
	showSlug: string | null;
	displayNumber: string;
	name: string | null;
	overview: string | null;
	thumbnail?: KyooImage | null;
	absoluteNumber: number | null;
	episodeNumber: number | null;
	seasonNumber: number | null;
	releaseDate: Date | null;
	runtime: number | null;
	watchedPercent: number | null;
	watchedStatus: WatchStatusV | null;
	href: string;
}> &
	PressableProps &
	Stylable) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const [descriptionExpanded, setDescriptionExpanded] = useState(false);
	const { css } = useYoshiki("episode-line");
	const { t } = useTranslation();

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			{...css(
				{
					alignItems: "center",
					flexDirection: "row",
					child: {
						more: {
							opacity: 0,
						},
					},
					fover: {
						self: focusReset,
						title: {
							textDecorationLine: "underline",
						},
						more: {
							opacity: 1,
						},
					},
				},
				props,
			)}
		>
			<ImageBackground
				src={thumbnail}
				quality="low"
				alt=""
				gradient={false}
				hideLoad={false}
				layout={{
					width: percent(18),
					aspectRatio: 16 / 9,
				}}
				{...(css({ flexShrink: 0, m: ts(1) }) as { style: ImageStyle })}
			>
				{(watchedPercent || watchedStatus === WatchStatusV.Completed) && (
					<>
						<View
							{...css({
								backgroundColor: (theme) => theme.overlay0,
								width: percent(100),
								height: ts(0.5),
								position: "absolute",
								bottom: 0,
							})}
						/>
						<View
							{...css({
								backgroundColor: (theme) => theme.accent,
								width: percent(watchedPercent ?? 100),
								height: ts(0.5),
								position: "absolute",
								bottom: 0,
							})}
						/>
					</>
				)}
			</ImageBackground>
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
							// biome-ignore lint/a11y/useValidAriaValues: simply use H6 for the style but keep a P
							<H6 aria-level={undefined} {...css([{ flexShrink: 1 }, "title"])}>
								{[displayNumber, name ?? t("show.episodeNoMetadata")].join(" · ")}
							</H6>
						)}
					</Skeleton>
					<View {...css({ flexDirection: "row", alignItems: "center" })}>
						<Skeleton>
							{isLoading || (
								<SubP>
									{/* Source https://www.i18next.com/translation-function/formatting#datetime */}
									{[
										releaseDate ? t("{{val, datetime}}", { val: releaseDate }) : null,
										displayRuntime(runtime),
									]
										.filter((item) => item != null)
										.join(" · ")}
								</SubP>
							)}
						</Skeleton>
						{slug && watchedStatus !== undefined && (
							<EpisodesContext
								slug={slug}
								showSlug={showSlug}
								status={watchedStatus}
								isOpen={moreOpened}
								setOpen={(v) => setMoreOpened(v)}
								{...css([
									"more",
									{ display: "flex", marginLeft: ts(3) },
									Platform.OS === "web" && moreOpened && { display: important("flex") },
								])}
							/>
						)}
					</View>
				</View>
				<View {...css({ flexDirection: "row" })}>
					<Skeleton>
						{isLoading || <P numberOfLines={descriptionExpanded ? undefined : 3}>{overview}</P>}
					</Skeleton>
					<IconButton
						{...css(["more", Platform.OS !== "web" && { opacity: 1 }])}
						icon={descriptionExpanded ? ExpandLess : ExpandMore}
						{...tooltip(t(descriptionExpanded ? "misc.collapse" : "misc.expand"))}
						onPress={(e) => {
							e.preventDefault();
							setDescriptionExpanded((isExpanded) => !isExpanded);
						}}
					/>
				</View>
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
