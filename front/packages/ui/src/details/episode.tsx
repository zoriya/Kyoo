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
	ImageBackground,
	ImageProps,
	important,
	Link,
	P,
	Skeleton,
	SubP,
	ts,
} from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { ImageStyle, Platform, PressableProps, View } from "react-native";
import { Layout, WithLoading } from "../fetch";
import { percent, rem, Stylable, Theme, useYoshiki } from "yoshiki/native";
import { KyooImage, WatchStatusV } from "@kyoo/models";
import { ItemProgress } from "../browse/grid";
import { EpisodesContext } from "../components/context-menus";
import { useRef, useState } from "react";

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
							display: "none",
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
							display: "flex",
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
							display: "none",
						},
					},
					fover: {
						self: focusReset,
						title: {
							textDecorationLine: "underline",
						},
						more: {
							display: "flex",
						},
					},
				},
				props,
			)}
		>
			<P {...css({ width: rem(4), flexShrink: 0, m: ts(1), textAlign: "center" })}>
				{isLoading ? <Skeleton variant="filltext" /> : displayNumber}
			</P>
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
							<H6 aria-level={undefined} {...css([{ flexShrink: 1 }, "title"])}>
								{name ?? t("show.episodeNoMetadata")}
							</H6>
						)}
					</Skeleton>
					{isLoading ||
						(runtime && <Skeleton>{isLoading || <SubP>{displayRuntime(runtime)}</SubP>}</Skeleton>)}
				</View>
				<View {...css({ flexDirection: "row" })}>
					<Skeleton>{isLoading || <P numberOfLines={3}>{overview}</P>}</Skeleton>
					{slug && watchedStatus !== undefined && (
						<EpisodesContext
							slug={slug}
							showSlug={showSlug}
							status={watchedStatus}
							isOpen={moreOpened}
							setOpen={(v) => setMoreOpened(v)}
							{...css([
								"more",
								Platform.OS === "web" && moreOpened && { display: important("flex") },
							])}
						/>
					)}
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
