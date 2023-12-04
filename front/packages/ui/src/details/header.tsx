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
	Movie,
	QueryIdentifier,
	Show,
	getDisplayDate,
	Genre,
	Studio,
	KyooImage,
} from "@kyoo/models";
import {
	Container,
	H1,
	ImageBackground,
	Skeleton,
	Poster,
	P,
	tooltip,
	Link,
	IconButton,
	IconFab,
	Head,
	HR,
	H2,
	UL,
	LI,
	A,
	ts,
	Chip,
	DottedSeparator,
	focusReset,
	SwitchVariant,
} from "@kyoo/primitives";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { ImageStyle, Platform, View } from "react-native";
import {
	Theme,
	md,
	px,
	min,
	max,
	em,
	percent,
	rem,
	vh,
	useYoshiki,
	Stylable,
} from "yoshiki/native";
import { Fetch } from "../fetch";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Theaters from "@material-symbols/svg-400/rounded/theaters-fill.svg";
import { Rating } from "../components/rating";
import { EpisodeLine, displayRuntime, episodeDisplayNumber } from "./episode";
import { WatchListInfo } from "../components/watchlist-info";
import { ShowWatchStatus, WatchStatusV } from "@kyoo/models/src/resources/watch-status";

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
					<View {...css({ flexDirection: "row", alignItems: "center" })}>
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
						<Chip key={tag ?? i} label={tag} size="small" {...css({ m: ts(0.5) })} />
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
							: [...Array(3)].map((_, i) => [i, undefined] as const)
						).map(([name, data]) => (
							<Chip
								key={name}
								as={A}
								href={data?.link}
								target="_blank"
								size="small"
								outline
								{...(css({
									m: ts(0.5),
									color: (theme: Theme) => theme.contrast,
									fover: {
										self: {
											color: (theme: Theme) => theme.contrast,
											bg: (theme: Theme) => theme.accent,
										},
									},
								}) as any)}
							>
								{data ? name : <Skeleton {...css({ width: rem(3) })} />}
							</Chip>
						))}
					</Container>
					{type === "show" && (data.watchStatus as ShowWatchStatus)?.nextEpisode && (
						<SwitchVariant>
							{({ css }) => (
								<Container
									{...css({
										marginY: ts(2),
										borderRadius: 16,
										overflow: "hidden",
										borderWidth: ts(0.5),
										borderStyle: "solid",
										borderColor: (theme) => theme.background,
										backgroundColor: (theme) => theme.background,
										fover: {
											self: { ...focusReset, borderColor: (theme: Theme) => theme.accent },
										},
									})}
								>
									<H2 {...css({ marginLeft: ts(2) })}>{t("show.nextUp")}</H2>
									<EpisodeLine
										isLoading={false}
										{...(data.watchStatus as ShowWatchStatus).nextEpisode!}
										displayNumber={episodeDisplayNumber((data.watchStatus as ShowWatchStatus).nextEpisode!)!}
									/>
								</Container>
							)}
						</SwitchVariant>
					)}
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
