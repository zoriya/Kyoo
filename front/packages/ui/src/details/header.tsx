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

import { Movie, QueryIdentifier, Show, getDisplayDate } from "@kyoo/models";
import {
	Container,
	H1,
	Main,
	ImageBackground,
	Skeleton,
	Poster,
	P,
	tooltip,
	Link,
	IconButton,
	IconFab,
} from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";
import { em, percent, rem, vh, useYoshiki, Stylable } from "yoshiki/native";
import { Fetch, WithLoading } from "../fetch";
import { Navbar } from "../navbar";

// const StudioText = ({
// 	studio,
// 	loading = false,
// 	sx,
// }: {
// 	studio?: Studio | null;
// 	loading?: boolean;
// 	sx?: SxProps;
// }) => {
// 	const { t } = useTranslation("browse");

// 	if (!loading && !studio) return null;
// 	return (
// 		<Typography sx={sx}>
// 			{t("show.studio")}:{" "}
// 			{loading ? (
// 				<Skeleton width="5rem" sx={{ display: "inline-flex" }} />
// 			) : (
// 				<Link href={`/studio/${studio!.slug}`}>{studio!.name}</Link>
// 			)}
// 		</Typography>
// 	);
// };

const TitleLine = ({
	isLoading,
	slug,
	name,
	date,
	poster,
	...props
}: {
	isLoading: boolean;
	slug: string;
	name?: string;
	date?: string;
	poster?: string | null;
} & Stylable) => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Container
			{...css(
				{
					flexDirection: { xs: "column", sm: "row" },
					alignItems: { xs: "center", sm: "flex-start" },
				},
				props,
			)}
		>
			<Poster
				src={poster}
				alt={name}
				isLoading={isLoading}
				layout={{
					width: { xs: percent(50), md: percent(25) },
				}}
				{...css({ maxWidth: { xs: px(175), sm: "unset" }, flexShrink: 0 })}
			/>
			<View
				{...css({
					alignSelf: { xs: "center", sm: "flex-end", md: "center" },
					alignItems: { xs: "center", sm: "flex-start" },
					paddingLeft: { sm: em(2.5) },
					flexShrink: 1,
				})}
			>
				<Skeleton {...css({ width: rem(15), height: rem(3), marginBottom: rem(0.5) })}>
					{isLoading || (
						<H1
							{...css({
								fontWeight: { md: "900" },
								fontSize: rem(3),
								marginTop: 0,
								marginBottom: rem(0.5),
								textAlign: { xs: "center", sm: "flex-start" },
								color: (theme) => ({ xs: theme.user.heading, md: theme.heading }),
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
									letterSpacing: 0,
									marginTop: 0,
									marginBottom: rem(0.5),
									textAlign: { xs: "center", sm: "flex-start" },
									color: (theme) => ({ xs: theme.user.heading, md: theme.heading }),
								})}
							>
								{date}
							</P>
						)}
					</Skeleton>
				)}
				<View {...css({ flexDirection: "row" })} /*sx={{ "& > *": { m: ".3rem !important" } }} */>
					<IconFab
						icon="play-arrow"
						as={Link}
						href={`/watch/${slug}`}
						color={{ xs: theme.user.colors.black, md: theme.colors.black }}
						{...css({ bg: { xs: theme.user.accent, md: theme.accent } })}
						{...tooltip(t("show.play"))}
					/>
					<IconButton
						icon="local-movies"
						color={{ xs: theme.user.colors.black, md: theme.colors.white }}
						{...tooltip(t("show.trailer"))}
					/>
				</View>
			</View>
			{/* <View */}
			{/* 	{...css({ */}
			{/* 		display: { xs: "none", md: "flex" }, */}
			{/* 		flexDirection: "column", */}
			{/* 		alignSelf: "flex-end", */}
			{/* 		paddingRight: px(15), */}
			{/* 	})} */}
			{/* > */}
			{/* 	{(isLoading || logo || true) && ( */}
			{/* 		<Image */}
			{/* 			src={logo} */}
			{/* 			alt="" */}
			{/* 			layout={{ */}
			{/* 				width: "100%", */}
			{/* 				height: px(100), */}
			{/* 			}} */}
			{/* 			// sx={{ display: { xs: "none", lg: "unset" } }} */}
			{/* 		/> */}
			{/* 	)} */}
			{/* 	{/1* <StudioText loading={!data} studio={data?.studio} sx={{ mt: "auto", mb: 3 }} /> *1/} */}
			{/* </View> */}
		</Container>
	);
};

// const Tata = () => {
// 	return (
// 		<Container sx={{ pt: 2 }}>
// 			<Typography align="justify" sx={{ flexBasis: 0, flexGrow: 1, pt: { sm: 2 } }}>
// 				{data
// 					? data.overview ?? t("show.noOverview")
// 					: [...Array(4)].map((_, i) => <Skeleton key={i} />)}
// 			</Typography>
// 			<Divider
// 				orientation="vertical"
// 				variant="middle"
// 				flexItem
// 				sx={{ mx: 2, display: { xs: "none", sm: "block" } }}
// 			/>
// 			<Box sx={{ flexBasis: "25%", display: { xs: "none", sm: "block" } }}>
// 				<StudioText
// 					loading={!data}
// 					studio={data?.studio}
// 					sx={{ display: { xs: "none", sm: "block", md: "none" }, pb: 2 }}
// 				/>

// 				<Typography variant="h4" component="h2">
// 					{t("show.genre")}
// 				</Typography>
// 				{!data || data.genres?.length ? (
// 					<ul>
// 						{(data ? data.genres! : [...Array(3)]).map((genre, i) => (
// 							<li key={genre?.id ?? i}>
// 								<Typography>
// 									{genre ? <Link href={`/genres/${genre.slug}`}>{genre.name}</Link> : <Skeleton />}
// 								</Typography>
// 							</li>
// 						))}
// 					</ul>
// 				) : (
// 					<Typography>{t("show.genre-none")}</Typography>
// 				)}
// 			</Box>
// 		</Container>
// 	);
// };

const min = Platform.OS === "web"
	? (...values: number[]): number => `min(${values.join(", ")})` as unknown as number
	: (...values: number[]): number => Math.min(...values);
const max = Platform.OS === "web"
	? (...values: number[]): number => `max(${values.join(", ")})` as unknown as number
	: (...values: number[]): number => Math.max(...values);
const px = Platform.OS === "web"
	? (value: number): number => `${value}px` as unknown as number
	: (value: number): number => value;

export const ShowHeader = ({
	query,
	slug,
}: {
	query: QueryIdentifier<Show | Movie>;
	slug: string;
}) => {
	/* const scroll = useScroll(); */
	const { css } = useYoshiki();
	// TODO: tweek the navbar color with the theme.

	return (
		<>
			<Navbar {...css({ bg: "transparent" })} />
			<Fetch query={query}>
				{({ isLoading, ...data }) => (
					<>
						{/* TODO: HEAD element for SEO*/}
						{/* TODO: Add a shadow on navbar items */}
						{/* TODO: Put the navbar outside of the scrollbox */}
						<ImageBackground
							src={data?.thumbnail}
							alt=""
							as={Main}
							containerStyle={{
								height: { xs: vh(40), sm: min(vh(60), px(750)), lg: vh(70) },
								minHeight: { xs: px(350), sm: px(500), lg: px(600) },
							}}
							{...css(StyleSheet.absoluteFillObject)}
						>
							<TitleLine
								isLoading={isLoading}
								slug={slug}
								name={data?.name}
								date={data ? getDisplayDate(data as any) : undefined}
								poster={data?.poster}
								{...css({
									marginTop: { xs: max(vh(20), px(200)), sm: vh(45), md: vh(35) }
								})}
							/>
							{/* <Container sx={{ display: { xs: "block", sm: "none" }, pt: 3 }}> */}
							{/* 	<StudioText loading={!data} studio={data?.studio} sx={{ mb: 1 }} /> */}
							{/* 	<Typography sx={{ mb: 1 }}> */}
							{/* 		{t("show.genre")} */}
							{/* 		{": "} */}
							{/* 		{!data ? ( */}
							{/* 			<Skeleton width="10rem" sx={{ display: "inline-flex" }} /> */}
							{/* 		) : data?.genres && data.genres.length ? ( */}
							{/* 			data.genres.map((genre, i) => [ */}
							{/* 				i > 0 && ", ", */}
							{/* 				<Link key={genre.id} href={`/genres/${genre.slug}`}> */}
							{/* 					{genre.name} */}
							{/* 				</Link>, */}
							{/* 			]) */}
							{/* 		) : ( */}
							{/* 			t("show.genre-none") */}
							{/* 		)} */}
							{/* 	</Typography> */}
							{/* </Container> */}
						</ImageBackground>
					</>
				)}
			</Fetch>
		</>
	);
};
