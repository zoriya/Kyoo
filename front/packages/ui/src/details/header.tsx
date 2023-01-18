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

import { Movie, QueryIdentifier, Show, getDisplayDate, Genre, Studio } from "@kyoo/models";
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
	Button,
} from "@kyoo/primitives";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, PressableProps, View } from "react-native";
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

const TitleLine = ({
	isLoading,
	slug,
	name,
	date,
	poster,
	studio,
	...props
}: {
	isLoading: boolean;
	slug: string;
	name?: string;
	date?: string;
	poster?: string | null;
	studio?: Studio | null;
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
				})}
			>
				<Poster
					src={poster}
					alt={name}
					isLoading={isLoading}
					layout={{
						width: { xs: percent(50), md: percent(25) },
					}}
					{...css({
						maxWidth: { xs: px(175), sm: Platform.OS === "web" ? "unset" : 99999999 },
						flexShrink: 0,
					})}
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
					<Skeleton
						variant="header"
						{...css({ width: rem(15), height: rem(2.5), marginBottom: rem(1) })}
					>
						{isLoading || (
							<H1
								{...css({
									fontWeight: { md: "900" },
									textAlign: { xs: "center", sm: "left" },
									color: (theme: Theme) => ({ xs: theme.user.heading, md: theme.heading }),
								})}
							>
								{name}
							</H1>
						)}
					</Skeleton>
					{(isLoading || date) && (
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
									{date}
								</P>
							)}
						</Skeleton>
					)}
					<View {...css({ flexDirection: "row" })}>
						<IconFab
							icon={PlayArrow}
							as={Link}
							href={`/watch/${slug}`}
							color={{ xs: theme.user.colors.black, md: theme.colors.black }}
							hasTVPreferredFocus
							{...css({
								bg: theme.user.accent,
								fover: { self: { bg: theme.user.accent } },
							})}
							{...tooltip(t("show.play"))}
						/>
						<IconButton
							icon={Theaters}
							color={{ xs: theme.user.contrast, md: theme.colors.white }}
							{...tooltip(t("show.trailer"))}
						/>
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
				{!Platform.isTV && (
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
							<A href={`/studio/${studio!.slug}`} {...css({ color: (theme) => theme.user.link })}>
								{studio!.name}
							</A>
						)}
					</P>
				)}
			</View>
		</Container>
	);
};

const TvPressable = ({ children, ...props }: PressableProps) => {
	if (!Platform.isTV) return <>{children}</>;
	return <Pressable {...props}>{children}</Pressable>;
};

const Description = ({
	isLoading,
	overview,
	genres,
	...props
}: {
	isLoading: boolean;
	overview?: string | null;
	genres?: Genre[];
} & Stylable) => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<Container
			{...css(
				{
					flexDirection: Platform.isTV ? "column" : { xs: "column", sm: "row" },
					paddingBottom: ts(1),
				},
				props,
			)}
		>
			{!Platform.isTV && (
				<P
					{...css({
						display: { xs: "flex", sm: "none" },
						flexWrap: "wrap",
						color: (theme: Theme) => theme.user.paragraph,
					})}
				>
					{t("show.genre")}:{" "}
					{(isLoading ? [...Array(3)] : genres!).map((genre, i) => (
						<Fragment key={genre?.slug ?? i.toString()}>
							<P>{i !== 0 && ", "}</P>
							{isLoading ? (
								<Skeleton {...css({ width: rem(5) })} />
							) : (
								<A href={`/genres/${genre.slug}`}>{genre.name}</A>
							)}
						</Fragment>
					))}
				</P>
			)}

			<TvPressable
				{...css({
					alignItems: "flex-start",
					child: {
						button: {
							flexGrow: 0,
							p: ts(2),
							borderRadius: ts(5),
						},
					},
					focus: {
						button: { bg: (theme: Theme) => theme.accent },
						text: { color: (theme: Theme) => theme.colors.white },
					},
				})}
			>
				<Skeleton
					lines={4}
					{...css({
						width: percent(100),
						flexBasis: 0,
						flexGrow: 1,
						paddingTop: Platform.isTV ? 0 : { sm: ts(4) },
					})}
				>
					{isLoading || (
						<P
							{...css({
								flexBasis: 0,
								flexGrow: 1,
								textAlign: "justify",
								paddingTop: Platform.isTV ? 0 : { sm: ts(4) },
							})}
						>
							{overview ?? t("show.noOverview")}
						</P>
					)}
				</Skeleton>
				{Platform.isTV && (
					<View {...css("button")}>
						<P {...css("text")}>{t("show.showMore")}</P>
					</View>
				)}
			</TvPressable>
			{!Platform.isTV && (
				<>
					<HR
						orientation="vertical"
						{...css({ marginX: ts(2), display: { xs: "none", sm: "flex" } })}
					/>
					<View {...css({ flexBasis: percent(25), display: { xs: "none", sm: "flex" } })}>
						<H2>{t("show.genre")}</H2>
						{isLoading || genres?.length ? (
							<UL>
								{(isLoading ? [...Array(3)] : genres!).map((genre, i) => (
									<LI key={genre?.id ?? i}>
										{isLoading ? (
											<Skeleton {...css({ marginBottom: 0 })} />
										) : (
											<A href={`/genres/${genre.slug}`}>{genre.name}</A>
										)}
									</LI>
								))}
							</UL>
						) : (
							<P>{t("show.genre-none")}</P>
						)}
					</View>
				</>
			)}
		</Container>
	);
};

export const Header = ({ query, slug }: { query: QueryIdentifier<Show | Movie>; slug: string }) => {
	const { css } = useYoshiki();

	// TODO center elements when they are focused 

	return (
		<Fetch query={query}>
			{({ isLoading, ...data }) => (
				<>
					<Head title={data?.name} description={data?.overview} />
					<ImageBackground
						src={data?.thumbnail}
						alt=""
						containerStyle={{
							height: {
								xs: vh(40),
								sm: min(vh(60), px(750)),
								md: min(vh(60), px(680)),
								lg: vh(70),
							},
							minHeight: { xs: px(350), sm: px(300), md: px(400), lg: px(600) },
						}}
					>
						<TitleLine
							isLoading={isLoading}
							slug={slug}
							name={data?.name}
							date={data ? getDisplayDate(data as any) : undefined}
							poster={data?.poster}
							studio={data?.studio}
							{...css({
								marginTop: {
									xs: max(vh(20), px(200)),
									sm: vh(45),
									md: max(vh(30), px(150)),
									lg: max(vh(35), px(200)),
								},
							})}
						/>
					</ImageBackground>
					<Description
						isLoading={isLoading}
						overview={data?.overview}
						genres={data?.genres}
						{...css({ paddingTop: { xs: 0, md: ts(2) } })}
					/>
				</>
			)}
		</Fetch>
	);
};
