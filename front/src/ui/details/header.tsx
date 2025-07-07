import Refresh from "@material-symbols/svg-400/rounded/autorenew.svg";
import Download from "@material-symbols/svg-400/rounded/download.svg";
import MoreHoriz from "@material-symbols/svg-400/rounded/more_horiz.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Theaters from "@material-symbols/svg-400/rounded/theaters-fill.svg";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { type ImageStyle, Platform, View } from "react-native";
import {
	em,
	max,
	md,
	min,
	percent,
	px,
	rem,
	type Stylable,
	type Theme,
	useYoshiki,
	vh,
} from "yoshiki/native";
import { WatchListInfo } from "~/components/items/watchlist-info";
import { Rating } from "~/components/rating";
import {
	type Genre,
	type KImage,
	Movie,
	Serie,
	Show,
	type Studio,
	type WatchStatusV,
} from "~/models";
import {
	A,
	Chip,
	Container,
	capitalize,
	DottedSeparator,
	GradientImageBackground,
	H1,
	H2,
	Head,
	HR,
	IconButton,
	IconFab,
	LI,
	Link,
	Menu,
	P,
	Poster,
	Skeleton,
	tooltip,
	ts,
	UL,
} from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { Fetch, type QueryIdentifier, useMutation } from "~/query";
import { displayRuntime, getDisplayDate } from "~/utils";

const ButtonList = ({
	kind,
	slug,
	playHref,
	trailerUrl,
	watchStatus,
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	playHref: string | null;
	trailerUrl: string | null;
	watchStatus: WatchStatusV | null;
}) => {
	const account = useAccount();
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();

	const metadataRefreshMutation = useMutation({
		method: "POST",
		path: [kind, slug, "refresh"],
		invalidate: null,
	});

	return (
		<View
			{...css({
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
			})}
		>
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
			{kind !== "collection" && (
				<WatchListInfo
					kind={kind}
					slug={slug}
					status={watchStatus}
					color={{ xs: theme.user.contrast, md: theme.colors.white }}
				/>
			)}
			{(kind === "movie" || account?.isAdmin === true) && (
				<Menu
					Trigger={IconButton}
					icon={MoreHoriz}
					{...tooltip(t("misc.more"))}
				>
					{kind === "movie" && (
						<>
							{/* <Menu.Item */}
							{/* 	icon={Download} */}
							{/* 	onSelect={() => downloader(kind, slug)} */}
							{/* 	label={t("home.episodeMore.download")} */}
							{/* /> */}
							<Menu.Item
								label={t("home.episodeMore.mediainfo")}
								icon={MovieInfo}
								href={`/${kind}/${slug}/info`}
							/>
						</>
					)}
					{account?.isAdmin === true && (
						<>
							{kind === "movie" && <HR />}
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
	kind,
	slug,
	playHref,
	name,
	tagline,
	date,
	rating,
	runtime,
	poster,
	trailerUrl,
	// studio,
	watchStatus,
	...props
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	playHref: string | null;
	name: string;
	tagline: string | null;
	date: string | null;
	rating: number | null;
	runtime: number | null;
	poster: KImage | null;
	trailerUrl: string | null;
	// studio: Studio;
	watchStatus: WatchStatusV | null;
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
					layout={{
						width: { xs: percent(50), md: percent(25) },
					}}
					{...(css({
						maxWidth: {
							xs: px(175),
							sm: Platform.OS === "web" ? ("unset" as any) : 99999999,
						},
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
						<H1
							{...css({
								color: (theme: Theme) => ({
									xs: theme.user.heading,
									md: theme.heading,
								}),
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
					</P>
					{tagline && (
						<P
							{...css({
								fontWeight: "300",
								fontSize: rem(1.5),
								marginTop: 0,
								letterSpacing: 0,
								textAlign: { xs: "center", sm: "left" },
								color: (theme: Theme) => ({
									xs: theme.user.heading,
									md: theme.heading,
								}),
							})}
						>
							{tagline}
						</P>
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
							kind={kind}
							slug={slug}
							playHref={playHref}
							trailerUrl={trailerUrl}
							watchStatus={watchStatus}
						/>
						<View
							{...css({
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
							})}
						>
							{rating !== null && rating !== 0 && (
								<>
									<DottedSeparator
										{...css({
											color: {
												xs: theme.user.contrast,
												md: theme.colors.white,
											},
										})}
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
										{...css({
											color: {
												xs: theme.user.contrast,
												md: theme.colors.white,
											},
										})}
									/>
									<P
										{...css({
											color: {
												xs: theme.user.contrast,
												md: theme.colors.white,
											},
										})}
									>
										{displayRuntime(runtime)}
									</P>
								</>
							)}
						</View>
					</View>
				</View>
			</View>
			{/* <View */}
			{/* 	{...css([ */}
			{/* 		{ */}
			{/* 			paddingTop: { xs: ts(3), sm: ts(8) }, */}
			{/* 			alignSelf: { xs: "flex-start", md: "flex-end" }, */}
			{/* 			justifyContent: "flex-end", */}
			{/* 			flexDirection: "column", */}
			{/* 		}, */}
			{/* 		md({ */}
			{/* 			position: "absolute", */}
			{/* 			top: 0, */}
			{/* 			bottom: 0, */}
			{/* 			right: 0, */}
			{/* 			width: percent(25), */}
			{/* 			height: percent(100), */}
			{/* 			paddingRight: ts(3), */}
			{/* 		}) as any, */}
			{/* 	])} */}
			{/* > */}
			{/* 	{studio && ( */}
			{/* 		<P */}
			{/* 			{...css({ */}
			{/* 				color: (theme: Theme) => theme.user.paragraph, */}
			{/* 				display: "flex", */}
			{/* 			})} */}
			{/* 		> */}
			{/* 			{t("show.studio")}:{" "} */}
			{/* 			<A */}
			{/* 				href={`/studio/${studio.slug}`} */}
			{/* 				{...css({ color: (theme) => theme.user.link })} */}
			{/* 			> */}
			{/* 				{studio.name} */}
			{/* 			</A> */}
			{/* 		</P> */}
			{/* 	)} */}
			{/* </View> */}
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
			{...css(
				{ paddingBottom: ts(1), flexDirection: { xs: "column", sm: "row" } },
				props,
			)}
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
							<A href={`/genres/${genre.toLowerCase()}`}>
								{t(`genres.${genre}`)}
							</A>
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
						<P {...css({ textAlign: "justify" })}>
							{overview ?? t("show.noOverview")}
						</P>
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
			<View
				{...css({
					flexBasis: percent(25),
					display: { xs: "none", sm: "flex" },
				})}
			>
				<H2>{t("show.genre")}</H2>
				{isLoading || genres?.length ? (
					<UL>
						{(isLoading ? [...Array<Genre>(3)] : genres!).map((genre, i) => (
							<LI key={genre ?? i}>
								{isLoading ? (
									<Skeleton {...css({ marginBottom: 0 })} />
								) : (
									<A href={`/genres/${genre.toLowerCase()}`}>
										{t(`genres.${genre}`)}
									</A>
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
	kind,
	slug,
}: {
	kind: "movie" | "serie";
	slug: string;
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Fetch
			query={Header.query(kind, slug)}
			Loader={() => <p>loading</p>}
			Render={(data) => (
				<>
					<Head
						title={data.name}
						description={data.description}
						image={data.thumbnail?.high}
					/>
					<GradientImageBackground
						src={data.thumbnail}
						quality="high"
						alt=""
						layout={{
							width: percent(100),
							height: {
								xs: vh(40),
								sm: min(vh(60), px(750)),
								md: min(vh(60), px(680)),
								lg: vh(70),
							},
						}}
						{...(css({
							minHeight: { xs: px(350), sm: px(300), md: px(400), lg: px(600) },
						}) as any)}
					>
						<TitleLine
							kind={kind}
							slug={slug}
							name={data.name}
							tagline={data.tagline}
							date={getDisplayDate(data)}
							rating={data.rating}
							runtime={data.kind === "movie" ? data.runtime : null}
							poster={data.poster}
							// studio={data.studio}
							playHref={data.kind !== "collection" ? data.playHref : null}
							trailerUrl={data.kind !== "collection" ? data.trailerUrl : null}
							watchStatus={
								data.kind !== "collection" ? data.watchStatus?.status! : null
							}
							{...css({
								marginTop: {
									xs: max(vh(20), px(200)),
									sm: vh(45),
									md: max(vh(30), px(150)),
									lg: max(vh(35), px(200)),
								},
							})}
						/>
					</GradientImageBackground>
					{/* <Description */}
					{/* 	isLoading={isLoading} */}
					{/* 	overview={data?.overview} */}
					{/* 	genres={data?.genres} */}
					{/* 	tags={data?.tags} */}
					{/* 	{...css({ paddingTop: { xs: 0, md: ts(2) } })} */}
					{/* /> */}
					{/* <Container */}
					{/* 	{...css({ */}
					{/* 		flexWrap: "wrap", */}
					{/* 		flexDirection: "row", */}
					{/* 		alignItems: "center", */}
					{/* 		marginTop: ts(0.5), */}
					{/* 	})} */}
					{/* > */}
					{/* 	<P {...css({ marginRight: ts(0.5), textAlign: "center" })}> */}
					{/* 		{t("show.links")}: */}
					{/* 	</P> */}
					{/* 	{(!isLoading */}
					{/* 		? Object.entries(data.externalId!).filter( */}
					{/* 				([_, data]) => data.link, */}
					{/* 			) */}
					{/* 		: [...Array(3)].map((_) => [undefined, undefined] as const) */}
					{/* 	).map(([name, data], i) => ( */}
					{/* 		<Chip */}
					{/* 			key={name ?? i} */}
					{/* 			label={name} */}
					{/* 			href={data?.link || undefined} */}
					{/* 			target="_blank" */}
					{/* 			size="small" */}
					{/* 			outline */}
					{/* 			{...css({ m: ts(0.5) })} */}
					{/* 		/> */}
					{/* 	))} */}
					{/* </Container> */}
					{/* {type === "show" && ( */}
					{/* 	<ShowWatchStatusCard {...(data?.watchStatus as any)} /> */}
					{/* )} */}
				</>
			)}
		/>
	);
};

Header.query = (
	kind: "serie" | "movie" | "collection",
	slug: string,
): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["api", `${kind}s`, slug],
	params: {
		with: ["studios"],
	},
});
