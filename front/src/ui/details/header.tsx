import BookmarkAdd from "@material-symbols/svg-400/rounded/bookmark_add.svg";
import MoreHoriz from "@material-symbols/svg-400/rounded/more_horiz.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Theaters from "@material-symbols/svg-400/rounded/theaters-fill.svg";
import { Stack } from "expo-router";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { WatchListInfo } from "~/components/items/watchlist-info";
import { Rating } from "~/components/rating";
import {
	type Genre,
	type KImage,
	Show,
	type Studio,
	type WatchStatusV,
} from "~/models";
import type { Metadata } from "~/models/utils/metadata";
import {
	A,
	Chip,
	Container,
	capitalize,
	DottedSeparator,
	H1,
	H2,
	Head,
	HR,
	IconButton,
	IconFab,
	ImageBackground,
	LI,
	Link,
	Menu,
	P,
	Poster,
	Skeleton,
	tooltip,
	UL,
} from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { Fetch, type QueryIdentifier } from "~/query";
import { cn, displayRuntime, getDisplayDate } from "~/utils";

const ButtonList = ({
	kind,
	slug,
	playHref,
	trailerUrl,
	watchStatus,
	iconsClassName,
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	playHref: string | null;
	trailerUrl: string | null;
	watchStatus: WatchStatusV | null;
	iconsClassName?: string;
}) => {
	const account = useAccount();
	const { t } = useTranslation();

	// const metadataRefreshMutation = useMutation({
	// 	method: "POST",
	// 	path: [kind, slug, "refresh"],
	// 	invalidate: null,
	// });

	return (
		<View className="flex-row items-center justify-center">
			{playHref !== null && (
				<IconFab
					icon={PlayArrow}
					as={Link}
					href={playHref}
					{...tooltip(t("show.play"))}
				/>
			)}
			{trailerUrl && (
				<IconButton
					icon={Theaters}
					as={Link}
					href={trailerUrl}
					target="_blank"
					iconClassName={iconsClassName}
					{...tooltip(t("show.trailer"))}
				/>
			)}
			{kind !== "collection" && (
				<WatchListInfo
					kind={kind}
					slug={slug}
					status={watchStatus}
					iconClassName={iconsClassName}
				/>
			)}
			{(kind === "movie" || account?.isAdmin === true) && (
				<Menu
					Trigger={IconButton}
					icon={MoreHoriz}
					iconClassName={iconsClassName}
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
								href={`/info/${slug}`}
							/>
						</>
					)}
					{/* {account?.isAdmin === true && ( */}
					{/* 	<> */}
					{/* 		{kind === "movie" && <HR />} */}
					{/* 		<Menu.Item */}
					{/* 			label={t("home.refreshMetadata")} */}
					{/* 			icon={Refresh} */}
					{/* 			onSelect={() => metadataRefreshMutation.mutate()} */}
					{/* 		/> */}
					{/* 	</> */}
					{/* )} */}
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
	watchStatus,
	className,
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
	watchStatus: WatchStatusV | null;
	className?: string;
}) => {
	return (
		<Container
			className={cn("flex-1 max-sm:items-center sm:flex-row", className)}
			{...props}
		>
			<Poster
				src={poster}
				alt={name}
				quality="medium"
				className="w-1/2 shrink-0 max-sm:max-w-44 md:w-1/4"
			/>
			<View className="flex-1 self-center max-sm:mt-8 max-sm:items-center sm:pl-10 sm:max-md:self-end md:max-lg:mt-5">
				<P className="max-sm:text-center">
					<H1 className="sm:text-slate-200">{name}</H1>
					{date && <P className="text-3xl sm:text-slate-300"> ({date})</P>}
				</P>
				{tagline && (
					<P className="font-light text-2xl max-sm:text-center sm:text-slate-200">
						{tagline}
					</P>
				)}
				<View className="flex-warp flex-row items-center max-sm:justify-center sm:mt-8">
					<ButtonList
						kind={kind}
						slug={slug}
						playHref={playHref}
						trailerUrl={trailerUrl}
						watchStatus={watchStatus}
						iconsClassName="lg:fill-slate-200 dark:fill-slate-200"
					/>
					{rating !== null && rating !== 0 && (
						<>
							<DottedSeparator className="lg:text-slate-200 dark:text-slate-200" />
							<Rating
								rating={rating}
								textClassName="lg:text-slate-200 dark:text-slate-200"
								iconClassName="lg:fill-slate-200 dark:fill-slate-200"
							/>
						</>
					)}
					{runtime && (
						<>
							<DottedSeparator className="lg:text-slate-200 dark:text-slate-200" />
							<P className="lg:text-slate-200 dark:text-slate-200">
								{displayRuntime(runtime)}
							</P>
						</>
					)}
				</View>
			</View>
		</Container>
	);
};

TitleLine.Loader = ({
	kind,
	className,
	...props
}: {
	kind: "serie" | "movie" | "collection";
	className?: string;
}) => {
	return (
		<Container
			className={cn("flex-1 max-sm:items-center sm:flex-row", className)}
			{...props}
		>
			<Poster.Loader className="w-1/2 shrink-0 max-sm:max-w-44 md:w-1/4" />
			<View className="flex-1 self-center max-sm:mt-8 max-sm:items-center sm:pl-10 sm:max-md:self-end md:max-lg:mt-5">
				<Skeleton variant="custom" className="h-10 w-2/5 max-sm:text-center" />
				<Skeleton className="h-6 w-4/5 max-sm:text-center" />
				<View className="flex-warp flex-row items-center max-sm:justify-center sm:mt-8">
					<IconFab icon={PlayArrow} iconClassName="lg:fill-slate-200" />
					<IconButton icon={Theaters} iconClassName="lg:fill-slate-200" />
					{kind !== "collection" && (
						<IconButton icon={BookmarkAdd} iconClassName="lg:fill-slate-200" />
					)}
					{kind === "movie" && <IconButton icon={MoreHoriz} />}
					<DottedSeparator className="lg:text-slate-200" />
					<Rating.Loader
						textClassName="lg:text-slate-200"
						iconClassName="lg:fill-slate-200"
					/>
					<DottedSeparator className="lg:text-slate-200" />
					<Skeleton className="w-1/5" />
				</View>
			</View>
		</Container>
	);
};

const Description = ({
	description,
	tags,
	genres,
	studios,
	externalIds,
	...props
}: {
	description: string | null;
	tags: string[];
	genres: Genre[];
	studios: Studio[];
	externalIds: Metadata;
}) => {
	const { t } = useTranslation();

	return (
		<Container className="py-10" {...props}>
			<View className="flex-1 flex-col-reverse sm:flex-row">
				<P className="py-5 text-justify">
					{description ?? t("show.noOverview")}
				</P>
				<View className="basis-1/5 flex-row xl:mt-[-100px]">
					<HR orientation="vertical" className="max-sm:hidden" />
					<View className="flex-1 max-sm:flex-row">
						<H2>{t("show.genre")}</H2>
						{genres.length ? (
							<UL className="flex-1 flex-wrap max-sm:flex-row max-sm:items-center max-sm:text-center">
								{genres.map((genre) => (
									<LI key={genre}>
										<A href={`/genres/${genre.toLowerCase()}`}>
											{t(`genres.${genre}`)}
										</A>
									</LI>
								))}
							</UL>
						) : (
							<P>{t("show.genre-none")}</P>
						)}
					</View>
				</View>
			</View>
			<View className="mt-5 flex-row flex-wrap items-center">
				<P className="mr-1">{t("show.tags")}:</P>
				{tags.map((tag) => (
					<Chip
						key={tag}
						label={tag && capitalize(tag)}
						href={`/search?q=${tag}`}
						size="small"
						className="m-1"
					/>
				))}
			</View>
			<P className="my-5 flex-row flex-wrap items-center">
				<P className="mr-1">{t("show.studios")}:</P>
				{studios.map((x, i) => (
					<Fragment key={x.id}>
						{i !== 0 && ","}
						<A href={x.slug} className="ml-2">
							{x.name}
						</A>
					</Fragment>
				))}
			</P>
			<View className="flex-row flex-wrap items-center">
				<P className="mr-1 text-center">{t("show.links")}:</P>
				{Object.entries(externalIds)
					.filter(([_, data]) => data.link)
					.map(([name, data]) => (
						<Chip
							key={name}
							label={name}
							href={data.link}
							target="_blank"
							size="small"
							outline
							className="m-1"
						/>
					))}
			</View>
		</Container>
	);
};

Description.Loader = ({ ...props }: object) => {
	const { t } = useTranslation();

	return (
		<Container className="py-10" {...props}>
			<View className="flex-1 flex-col-reverse sm:flex-row">
				<Skeleton lines={4} />
				<View className="basis-1/5 flex-row xl:mt-[-100px]">
					<HR orientation="vertical" className="max-sm:hidden" />
					<View className="flex-1 items-center max-sm:flex-row">
						<H2>{t("show.genre")}</H2>
						<UL className="flex-1 flex-wrap max-sm:flex-row max-sm:items-center max-sm:text-center">
							{[...Array(3)].map((_, i) => (
								<LI key={i}>
									<Skeleton className="w-25" />
								</LI>
							))}
						</UL>
					</View>
				</View>
			</View>
			<View className="mt-5 flex-row flex-wrap items-center">
				<P className="mr-1">{t("show.tags")}:</P>
				{[...Array(3)].map((_, i) => (
					<Chip.Loader key={i} size="small" className="m-1" />
				))}
			</View>
			<P className="my-5 flex flex-row flex-wrap items-center">
				<P className="mr-1">{t("show.studios")}:</P>
				<Skeleton className="w-2/5" />
			</P>
			<View className="flex-row flex-wrap items-center">
				<P className="mr-1 text-center">{t("show.links")}:</P>
				{[...Array(2)].map((_, i) => (
					<Chip.Loader key={i} size="small" outline className="m-1" />
				))}
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
	return (
		<>
			<Stack.Screen
				options={{
					headerTransparent: true,
					headerStyle: { backgroundColor: undefined },
				}}
			/>
			<Fetch
				query={Header.query(kind, slug)}
				Render={(data) => (
					<View className="flex-1">
						<Head
							title={data.name}
							description={data.description}
							image={data.thumbnail?.high}
						/>
						<ImageBackground
							src={data.thumbnail}
							quality="high"
							alt=""
							className="absolute top-0 right-0 left-0 h-[40vh] w-full sm:h-[60vh] sm:min-h-[750px] md:min-h-[680px] lg:h-[65vh]"
						>
							<View className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/70" />
						</ImageBackground>
						<TitleLine
							kind={kind}
							slug={slug}
							name={data.name}
							tagline={data.tagline}
							date={getDisplayDate(data)}
							rating={data.rating}
							runtime={data.kind === "movie" ? data.runtime : null}
							poster={data.poster}
							playHref={data.kind !== "collection" ? data.playHref : null}
							trailerUrl={data.kind !== "collection" ? data.trailerUrl : null}
							watchStatus={
								data.kind !== "collection"
									? (data.watchStatus?.status ?? null)
									: null
							}
							className="mt-[max(20vh,200px)] sm:mt-[35vh] md:mt-[max(45vh,150px)] lg:mt-[max(35vh,200px)]"
						/>
						<Description
							description={data.description}
							tags={data.tags}
							genres={data.genres}
							studios={data.kind !== "collection" ? data.studios! : []}
							externalIds={data.externalId}
						/>

						{/* {type === "show" && ( */}
						{/* 	<ShowWatchStatusCard {...(data?.watchStatus as any)} /> */}
						{/* )} */}
					</View>
				)}
				Loader={() => (
					<View className="flex-1">
						<View className="absolute top-0 right-0 left-0 h-[40vh] w-full bg-linear-to-b from-transparent to-slate-950/70 sm:h-[60vh] sm:min-h-[750px] md:min-h-[680px] lg:h-[65vh]" />
						<TitleLine.Loader
							kind={kind}
							className="mt-[max(20vh,200px)] sm:mt-[35vh] md:mt-[max(45vh,150px)] lg:mt-[max(35vh,200px)]"
						/>
						<Description.Loader />
					</View>
				)}
			/>
		</>
	);
};

Header.query = (
	kind: "serie" | "movie" | "collection",
	slug: string,
): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["api", `${kind}s`, slug],
	params: {
		with: ["studios", ...(kind === "serie" ? ["firstEntry", "nextEntry"] : [])],
	},
});
