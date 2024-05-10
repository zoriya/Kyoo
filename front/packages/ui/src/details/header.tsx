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
	type Genre,
	type KyooImage,
	type Movie,
	type QueryIdentifier,
	type Show,
	type Studio,
	getDisplayDate,
	queryFn,
	useAccount,
} from "@kyoo/models";
import type { WatchStatusV } from "@kyoo/models/src/resources/watch-status";
import {
	A,
	Chip,
	Container,
	DottedSeparator,
	H1,
	H2,
	HR,
	Head,
	IconButton,
	IconFab,
	ImageBackground,
	LI,
	Link,
	Menu,
	P,
	Poster,
	Skeleton,
	UL,
	capitalize,
	tooltip,
	ts,
	usePopup,
} from "@kyoo/primitives";
import Refresh from "@material-symbols/svg-400/rounded/autorenew.svg";
import Download from "@material-symbols/svg-400/rounded/download.svg";
import MoreHoriz from "@material-symbols/svg-400/rounded/more_horiz.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Theaters from "@material-symbols/svg-400/rounded/theaters-fill.svg";
import { useMutation } from "@tanstack/react-query";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { type ImageStyle, Platform, View } from "react-native";
import {
	type Stylable,
	type Theme,
	em,
	max,
	md,
	min,
	percent,
	px,
	rem,
	useYoshiki,
	vh,
} from "yoshiki/native";
import { MediaInfoPopup } from "../components/media-info";
import { Rating } from "../components/rating";
import { WatchListInfo } from "../components/watchlist-info";
import { useDownloader } from "../downloads";
import { Fetch } from "../fetch";
import { displayRuntime } from "./episode";
import { ShowWatchStatusCard } from "./show";

const ButtonList = ({
	playHref,
	trailerUrl,
	watchStatus,
	type,
	slug,
}: {
	type: "movie" | "show" | "collection";
	slug?: string;
	playHref?: string | null;
	trailerUrl?: string | null;
	watchStatus?: WatchStatusV | null;
}) => {
	const account = useAccount();
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const downloader = useDownloader();
	const [setPopup, close] = usePopup();

	const metadataRefreshMutation = useMutation({
		mutationFn: () =>
			queryFn({
				path: [type, slug, "refresh"],
				method: "POST",
			}),
	});

	return (
		<View {...css({ flexDirection: "row", alignItems: "center", justifyContent: "center" })}>
			{playHref !== null && (
				<IconFab
					icon={PlayArrow}
					as={Link}
					href={playHref}
					color={{ xs: theme.user.colors.black, md: theme.colors.black }}
					{...css({
						bg: theme.user.accent,
						fover: { self: { bg: theme.user.accent } },
					})}
					{...tooltip(t("show.play"))}
				/>
			)}
			{trailerUrl && (
				<IconButton
					icon={Theaters}
					as={Link}
					href={trailerUrl}
					target="_blank"
					color={{ xs: theme.user.contrast, md: theme.colors.white }}
					{...tooltip(t("show.trailer"))}
				/>
			)}
			{watchStatus !== undefined && type !== "collection" && slug && (
				<WatchListInfo
					type={type}
					slug={slug}
					status={watchStatus}
					color={{ xs: theme.user.contrast, md: theme.colors.white }}
				/>
			)}
			{((type === "movie" && slug) || account?.isAdmin === true) && (
				<Menu Trigger={IconButton} icon={MoreHoriz} {...tooltip(t("misc.more"))}>
					{type === "movie" && slug && (
						<>
							<Menu.Item
								icon={Download}
								onSelect={() => downloader(type, slug)}
								label={t("home.episodeMore.download")}
							/>
							<Menu.Item
								icon={MovieInfo}
								label={t("home.episodeMore.mediainfo")}
								onSelect={() =>
									setPopup(<MediaInfoPopup mediaType={"movie"} mediaSlug={slug!} close={close} />)
								}
							/>
						</>
					)}
					{account?.isAdmin === true && (
						<>
							{type === "movie" && <HR />}
							<Menu.Item
								label={t("home.refreshMetadata")}
								icon={Refresh}
								onSelect={() => metadataRefreshMutation.mutate()}
							/>
						</>
					)}
				</Menu>
			)}
		</View>
	);
};

export const TitleLine = ({
	isLoading,
	playHref,
	name,
	tagline,
	date,
	rating,
	runtime,
	poster,
	studio,
	trailerUrl,
	type,
	watchStatus,
	slug,
	...props
}: {
	isLoading: boolean;
	playHref?: string | null;
	name?: string;
	tagline?: string | null;
	date?: string | null;
	rating?: number | null;
	runtime?: number | null;
	poster?: KyooImage | null;
	studio?: Studio | null;
	trailerUrl?: string | null;
	watchStatus?: WatchStatusV | null;
	type: "movie" | "show" | "collection";
	slug?: string;
} & Stylable) => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Container
			{...css(
				{
					flexDirection: { xs: "column", md: "row" },
				},
				props,
			)}
		>
			<View
				{...css({
					flexDirection: { xs: "column", sm: "row" },
					alignItems: { xs: "center", sm: "flex-start" },
					flexGrow: 1,
					maxWidth: percent(100),
				})}
			>
				<Poster
					src={poster}
					alt={name}
					quality="medium"
					forcedLoading={isLoading}
					layout={{
						width: { xs: percent(50), md: percent(25) },
					}}
					{...(css({
						maxWidth: { xs: px(175), sm: Platform.OS === "web" ? ("unset" as any) : 99999999 },
						flexShrink: 0,
					}) as { style: ImageStyle })}
				/>
				<View
					{...css({
						alignSelf: { xs: "center", sm: "flex-end", md: "center" },
						alignItems: { xs: "center", sm: "flex-start" },
						paddingLeft: { sm: em(2.5) },
						flexShrink: 1,
						flexGrow: 1,
					})}
				>
					<P
						{...css({
							textAlign: { xs: "center", sm: "left" },
						})}
					>
						<Skeleton
							variant="header"
							{...css({ width: rem(15), height: rem(2.5), marginBottom: rem(1) })}
						>
							{isLoading || (
								<>
									<H1
										{...css({
											color: (theme: Theme) => ({ xs: theme.user.heading, md: theme.heading }),
										})}
									>
										{name}
									</H1>
									{date && (
										<P
											{...css({
												fontSize: rem(2.5),
												color: (theme: Theme) => ({
													xs: theme.user.paragraph,
													md: theme.paragraph,
												}),
											})}
										>
											{" "}
											({date})
										</P>
									)}
								</>
							)}
						</Skeleton>
					</P>
					{(isLoading || tagline) && (
						<Skeleton
							{...css({
								width: rem(5),
								height: rem(1.5),
								marginBottom: rem(0.5),
							})}
						>
							{isLoading || (
								<P
									{...css({
										fontWeight: "300",
										fontSize: rem(1.5),
										marginTop: 0,
										letterSpacing: 0,
										textAlign: { xs: "center", sm: "left" },
										color: (theme: Theme) => ({ xs: theme.user.heading, md: theme.heading }),
									})}
								>
									{tagline}
								</P>
							)}
						</Skeleton>
					)}
					<View
						{...css({
							flexDirection: "row",
							alignItems: "center",
							flexWrap: "wrap",
							justifyContent: "center",
						})}
					>
						<ButtonList
							type={type}
							slug={slug}
							playHref={playHref}
							trailerUrl={trailerUrl}
							watchStatus={watchStatus}
						/>
						<View
							{...css({ flexDirection: "row", alignItems: "center", justifyContent: "center" })}
						>
							{rating !== null && (
								<>
									<DottedSeparator
										{...css({ color: { xs: theme.user.contrast, md: theme.colors.white } })}
									/>
									<Rating
										rating={rating}
										color={{ xs: theme.user.contrast, md: theme.colors.white }}
									/>
								</>
							)}
							{runtime && (
								<>
									<DottedSeparator
										{...css({ color: { xs: theme.user.contrast, md: theme.colors.white } })}
									/>
									<P {...css({ color: { xs: theme.user.contrast, md: theme.colors.white } })}>
										{displayRuntime(runtime)}
									</P>
								</>
							)}
						</View>
					</View>
				</View>
			</View>
			<View
				{...css([
					{
						paddingTop: { xs: ts(3), sm: ts(8) },
						alignSelf: { xs: "flex-start", md: "flex-end" },
						justifyContent: "flex-end",
						flexDirection: "column",
					},
					md({
						position: "absolute",
						top: 0,
						bottom: 0,
						right: 0,
						width: percent(25),
						height: percent(100),
						paddingRight: ts(3),
					}),
				])}
			>
				{isLoading ||
					(studio && (
						<P
							{...css({
								color: (theme: Theme) => theme.user.paragraph,
								display: "flex",
							})}
						>
							{t("show.studio")}:{" "}
							{isLoading ? (
								<Skeleton {...css({ width: rem(5) })} />
							) : (
								<A href={`/studio/${studio.slug}`} {...css({ color: (theme) => theme.user.link })}>
									{studio.name}
								</A>
							)}
						</P>
					))}
			</View>
		</Container>
	);
};

const Description = ({
	isLoading,
	overview,
	tags,
	genres,
	...props
}: {
	isLoading: boolean;
	overview?: string | null;
	tags?: string[];
	genres?: Genre[];
} & Stylable) => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<Container
			{...css({ paddingBottom: ts(1), flexDirection: { xs: "column", sm: "row" } }, props)}
		>
			<P
				{...css({
					display: { xs: "flex", sm: "none" },
					flexWrap: "wrap",
					color: (theme: Theme) => theme.user.paragraph,
				})}
			>
				{t("show.genre")}:{" "}
				{(isLoading ? [...Array<Genre>(3)] : genres!).map((genre, i) => (
					<Fragment key={genre ?? i.toString()}>
						<P {...css({ m: 0 })}>{i !== 0 && ", "}</P>
						{isLoading ? (
							<Skeleton {...css({ width: rem(5) })} />
						) : (
							<A href={`/genres/${genre.toLowerCase()}`}>{genre}</A>
						)}
					</Fragment>
				))}
			</P>

			<View
				{...css({
					flexDirection: "column",
					flexGrow: 1,
					flexBasis: { sm: 0 },
					paddingTop: ts(4),
				})}
			>
				<Skeleton lines={4}>
					{isLoading || (
						<P {...css({ textAlign: "justify" })}>{overview ?? t("show.noOverview")}</P>
					)}
				</Skeleton>
				<View
					{...css({
						flexWrap: "wrap",
						flexDirection: "row",
						alignItems: "center",
						marginTop: ts(0.5),
					})}
				>
					<P {...css({ marginRight: ts(0.5) })}>{t("show.tags")}:</P>
					{(isLoading ? [...Array<string>(3)] : tags!).map((tag, i) => (
						<Chip
							key={tag ?? i}
							label={tag && capitalize(tag)}
							href={`/search?q=${tag}`}
							size="small"
							{...css({ m: ts(0.5) })}
						/>
					))}
				</View>
			</View>
			<HR
				orientation="vertical"
				{...css({ marginX: ts(2), display: { xs: "none", sm: "flex" } })}
			/>
			<View {...css({ flexBasis: percent(25), display: { xs: "none", sm: "flex" } })}>
				<H2>{t("show.genre")}</H2>
				{isLoading || genres?.length ? (
					<UL>
						{(isLoading ? [...Array<Genre>(3)] : genres!).map((genre, i) => (
							<LI key={genre ?? i}>
								{isLoading ? (
									<Skeleton {...css({ marginBottom: 0 })} />
								) : (
									<A href={`/genres/${genre.toLowerCase()}`}>{genre}</A>
								)}
							</LI>
						))}
					</UL>
				) : (
					<P>{t("show.genre-none")}</P>
				)}
			</View>
		</Container>
	);
};

export const Header = ({
	query,
	type,
}: {
	query: QueryIdentifier<Show | Movie>;
	type: "movie" | "show";
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Fetch query={query}>
			{({ isLoading, ...data }) => (
				<>
					<Head title={data?.name} description={data?.overview} image={data?.thumbnail?.high} />
					<ImageBackground
						src={data?.thumbnail}
						quality="high"
						alt=""
						containerStyle={Header.containerStyle}
					>
						<TitleLine
							isLoading={isLoading}
							type={type}
							slug={data?.slug}
							playHref={data?.playHref}
							name={data?.name}
							tagline={data?.tagline}
							date={data ? getDisplayDate(data as any) : undefined}
							rating={data?.rating}
							runtime={"runtime" in data ? data.runtime : null}
							poster={data?.poster}
							trailerUrl={data?.trailer}
							studio={data?.studio}
							watchStatus={data?.watchStatus?.status ?? null}
							{...css(Header.childStyle)}
						/>
					</ImageBackground>
					<Description
						isLoading={isLoading}
						overview={data?.overview}
						genres={data?.genres}
						tags={data?.tags}
						{...css({ paddingTop: { xs: 0, md: ts(2) } })}
					/>
					<Container
						{...css({
							flexWrap: "wrap",
							flexDirection: "row",
							alignItems: "center",
							marginTop: ts(0.5),
						})}
					>
						<P {...css({ marginRight: ts(0.5), textAlign: "center" })}>{t("show.links")}:</P>
						{(!isLoading
							? Object.entries(data.externalId!).filter(([_, data]) => data.link)
							: [...Array(3)].map((_) => [undefined, undefined] as const)
						).map(([name, data], i) => (
							<Chip
								key={name ?? i}
								label={name}
								href={data?.link || undefined}
								target="_blank"
								size="small"
								outline
								{...css({ m: ts(0.5) })}
							/>
						))}
					</Container>
					{type === "show" && <ShowWatchStatusCard {...(data?.watchStatus as any)} />}
				</>
			)}
		</Fetch>
	);
};

Header.containerStyle = {
	height: {
		xs: vh(40),
		sm: min(vh(60), px(750)),
		md: min(vh(60), px(680)),
		lg: vh(70),
	},
	minHeight: { xs: px(350), sm: px(300), md: px(400), lg: px(600) },
};

Header.childStyle = {
	marginTop: {
		xs: max(vh(20), px(200)),
		sm: vh(45),
		md: max(vh(30), px(150)),
		lg: max(vh(35), px(200)),
	},
};
