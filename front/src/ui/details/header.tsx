import Info from "@material-symbols/svg-400/rounded/info.svg";
import MoreHoriz from "@material-symbols/svg-400/rounded/more_horiz.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Theaters from "@material-symbols/svg-400/rounded/theaters-fill.svg";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View, type ViewProps } from "react-native";
import { entryDisplayNumber } from "~/components/entries";
import {
	EntrySelect,
	type EntrySelectEntry,
} from "~/components/entries/select";
import { ShowContext } from "~/components/items/context-menus";
import { WatchListInfo } from "~/components/items/watchlist-info";
import { Rating } from "~/components/rating";
import {
	type Entry,
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
	P,
	Popup,
	Poster,
	rem,
	Skeleton,
	tooltip,
	UL,
} from "~/primitives";
import { Fetch, type QueryIdentifier } from "~/query";
import { cn, displayRuntime, getDisplayDate } from "~/utils";
import { useHeroHeight } from "../hero";
import { PartOf } from "./part-of";

const ButtonList = ({
	kind,
	slug,
	playHref,
	displayNumber,
	name,
	videos,
	trailerUrl,
	watchStatus,
	iconsClassName,
	videoSlug,
	openInfo,
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	playHref: string | null;
	displayNumber: string | null;
	name: string;
	videos: Entry["videos"] | null;
	trailerUrl: string | null;
	watchStatus: WatchStatusV | null;
	iconsClassName?: string;
	videoSlug: string | null;
	openInfo?: () => void;
}) => {
	const { t } = useTranslation();
	const [selected, setSelected] = useState<EntrySelectEntry | null>(null);

	return (
		<View className="flex-row items-center justify-center">
			{playHref !== null && (
				<IconFab
					icon={PlayArrow}
					{...(videos && videos.length > 1
						? {
								onPress: () => {
									if (!videos) return;
									setSelected({ displayNumber, name, videos });
								},
							}
						: {
								as: Link,
								href: videos?.length ? playHref : null,
								disabled: !videos?.length,
							})}
					{...tooltip(t("show.play"))}
				/>
			)}
			{trailerUrl && (
				<IconButton
					icon={Theaters}
					as={Link}
					href={trailerUrl}
					iconClassName={iconsClassName}
					{...tooltip(t("show.trailer"))}
				/>
			)}
			{openInfo && (
				<IconButton
					icon={Info}
					onPress={openInfo}
					iconClassName={iconsClassName}
					{...tooltip(t("show.details"))}
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
			<ShowContext
				kind={kind}
				slug={slug}
				name={name}
				videoSlug={videoSlug}
				status={watchStatus}
				showWatchlist={false}
				iconClassName={iconsClassName}
				horizontal
			/>
			<EntrySelect entry={selected} onClose={() => setSelected(null)} />
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
	displayNumber,
	videos,
	openInfo,
	className,
	...props
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	playHref: string | null;
	name: string;
	tagline: string | null;
	date: string | null;
	rating: Record<string, number>;
	runtime: number | null;
	poster: KImage | null;
	trailerUrl: string | null;
	watchStatus: WatchStatusV | null;
	displayNumber: string | null;
	videos: Entry["videos"] | null;
	openInfo?: () => void;
	className?: string;
} & ViewProps) => {
	return (
		<Container
			className={cn(
				"flex-1 max-sm:items-center sm:translate-y-[10%] sm:flex-row",
				className,
			)}
			{...props}
		>
			<Poster
				src={poster}
				quality="medium"
				className="w-1/2 shrink-0 max-sm:max-w-44 sm:w-1/4 sm:max-w-[30vh]"
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
						displayNumber={displayNumber}
						name={name}
						videos={videos}
						trailerUrl={trailerUrl}
						watchStatus={watchStatus}
						iconsClassName="sm:fill-slate-200 dark:fill-slate-200"
						videoSlug={videos?.length === 1 ? videos[0].slug : null}
						openInfo={openInfo}
					/>
					{Object.keys(rating).length > 0 && (
						<>
							<DottedSeparator className="sm:text-slate-200 dark:text-slate-200" />
							<Rating
								rating={rating}
								textClassName="sm:text-slate-200 dark:text-slate-200"
								iconClassName="sm:fill-slate-200 dark:fill-slate-200"
							/>
						</>
					)}
					{runtime && (
						<>
							<DottedSeparator className="sm:text-slate-200 dark:text-slate-200" />
							<P className="sm:text-slate-200 dark:text-slate-200">
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
	openInfo,
	className,
	...props
}: {
	kind: "serie" | "movie" | "collection";
	openInfo?: () => void;
	className?: string;
} & ViewProps) => {
	return (
		<Container
			className={cn(
				"flex-1 max-sm:items-center sm:translate-y-[10%] sm:flex-row",
				className,
			)}
			{...props}
		>
			<Poster.Loader className="w-1/2 shrink-0 max-sm:max-w-44 sm:w-1/4 sm:max-w-[30vh]" />
			<View className="flex-1 self-center max-sm:mt-8 max-sm:items-center sm:pl-10 sm:max-md:self-end md:max-lg:mt-5">
				<Skeleton variant="custom" className="h-10 w-2/5 max-sm:text-center" />
				<Skeleton className="h-6 w-4/5 max-sm:text-center" />
				<View className="flex-warp flex-row items-center max-sm:justify-center sm:mt-8">
					<IconFab icon={PlayArrow} iconClassName="sm:fill-slate-200" />
					<IconButton icon={Theaters} iconClassName="sm:fill-slate-200" />
					{openInfo && (
						<IconButton icon={Info} iconClassName="sm:fill-slate-200" />
					)}
					<IconButton icon={MoreHoriz} iconClassName="sm:fill-slate-200" />
					<DottedSeparator className="sm:text-slate-200" />
					<Rating.Loader
						textClassName="sm:text-slate-200"
						iconClassName="sm:fill-slate-200"
					/>
					<DottedSeparator className="sm:text-slate-200" />
					<Skeleton className="w-1/5" />
				</View>
			</View>
		</Container>
	);
};

export const ExternalIdChip = ({
	name,
	items,
}: {
	name: string;
	items: Metadata[string];
}) => {
	const [open, setOpen] = useState(false);

	const withLinks = items.filter((x) => x.link);
	if (withLinks.length === 0) return null;

	return (
		<>
			<Chip
				label={name}
				href={withLinks.length === 1 ? withLinks[0].link : null}
				size="small"
				outline
				className="m-1"
				onPress={withLinks.length > 1 ? () => setOpen(true) : undefined}
			/>
			{open && (
				<Popup title={capitalize(name)} close={() => setOpen(false)}>
					{withLinks
						.sort((a, b) =>
							(a.label ?? a.link!).localeCompare(b.label ?? b.link!),
						)
						.map((x) => (
							<A
								key={x.dataId}
								href={x.link!}
								className="rounded highlighted:bg-popover p-4 outline-0"
							>
								{x.label ?? x.link}
							</A>
						))}
				</Popup>
			)}
		</>
	);
};

const Description = ({
	description,
	tags,
	genres,
	studios,
	externalIds,
	textOnly,
	...props
}: {
	description: string | null;
	tags: string[];
	genres: Genre[];
	studios: Studio[] | null;
	externalIds: Metadata;
	textOnly?: boolean;
}) => {
	const { t } = useTranslation();

	if (textOnly)
		return (
			<Container className="py-10" {...props}>
				<P className="py-5 text-justify">
					{description ?? t("show.noOverview")}
				</P>
			</Container>
		);

	return (
		<Container className="py-10" {...props}>
			<View className="flex-1 flex-col-reverse sm:flex-row">
				<P className="flex-1 py-5 text-justify">
					{description ?? t("show.noOverview")}
				</P>
				<View className="basis-1/5 flex-row xl:-mt-25">
					<HR orientation="vertical" className="max-sm:hidden" />
					<View className="flex-1 max-sm:flex-row">
						<H2>{t("show.genre")}</H2>
						{genres.length ? (
							<UL className="flex-1 flex-wrap max-sm:flex-row max-sm:items-center max-sm:text-center">
								{genres.map((genre) => (
									<LI key={genre}>
										<A
											href={`/browse?filter=genres has ${genre.toLowerCase()}`}
										>
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
				{tags.length ? (
					tags.map((tag) => (
						<Chip
							key={tag}
							label={tag && capitalize(tag)}
							href={`/browse?q=${tag}`}
							size="small"
							className="m-1"
						/>
					))
				) : (
					<P>{t("show.tags-none")}</P>
				)}
			</View>
			{studios !== null && (
				<P className="my-5 flex-row flex-wrap items-center">
					<P className="mr-1">{t("show.studios")}:</P>
					{studios.map((x, i) => (
						<Fragment key={x.id}>
							{i !== 0 && ","}
							<A href={`/browse?filter=studios has ${x.slug}`} className="ml-2">
								{x.name}
							</A>
						</Fragment>
					))}
				</P>
			)}
			<View className="flex-row flex-wrap items-center">
				<P className="mr-1 text-center">{t("show.links")}:</P>
				{Object.entries(externalIds).map(([name, items]) => (
					<ExternalIdChip key={name} name={name} items={items} />
				))}
			</View>
		</Container>
	);
};

Description.Loader = ({ textOnly, ...props }: { textOnly?: boolean }) => {
	const { t } = useTranslation();

	if (textOnly)
		return (
			<Container className="py-10" {...props}>
				<Skeleton lines={4} />
			</Container>
		);

	return (
		<Container className="py-10" {...props}>
			<View className="flex-1 flex-col-reverse sm:flex-row">
				<Skeleton lines={4} />
				<View className="basis-1/5 flex-row xl:-mt-25">
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
	openInfo,
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	openInfo?: () => void;
}) => {
	const hero = useHeroHeight();
	const overhang = Math.round(Math.min(hero * 0.1, rem(50)));
	const { width } = useWindowDimensions();
	const stackedTop = Math.round(
		hero + overhang - Math.min(width / 2, rem(44)) * 1.5,
	);

	return (
		<Fetch
			query={Header.query(kind, slug)}
			Render={(data) => (
				<View className="flex-1">
					<Head
						title={data.name}
						description={data.description}
						image={data.thumbnail?.high}
					/>
					<View
						collapsable={false}
						scrollSnapAlign="start"
						style={{ minHeight: hero, marginBottom: overhang }}
					>
						<ImageBackground
							src={data.thumbnail}
							quality="high"
							alt=""
							className="absolute top-0 right-0 left-0"
							style={{ height: hero }}
						>
							<View className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/70" />
						</ImageBackground>
						<View
							className="sm:absolute sm:right-0 sm:bottom-0 sm:left-0"
							style={{ marginTop: stackedTop }}
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
								playHref={data.kind !== "collection" ? data.playHref : null}
								trailerUrl={data.kind !== "collection" ? data.trailerUrl : null}
								watchStatus={
									data.kind !== "collection"
										? (data.watchStatus?.status ?? null)
										: null
								}
								displayNumber={
									data.kind === "serie" && (data.nextEntry ?? data.firstEntry)
										? entryDisplayNumber(data.nextEntry ?? data.firstEntry!)
										: null
								}
								videos={
									data.kind === "movie"
										? (data.videos ?? null)
										: data.kind === "serie"
											? ((data.nextEntry ?? data.firstEntry)?.videos ?? null)
											: null
								}
								openInfo={openInfo}
							/>
						</View>
					</View>
					<Description
						description={data.description}
						tags={data.tags}
						genres={data.genres}
						studios={data.kind !== "collection" ? data.studios! : null}
						externalIds={data.externalId}
						textOnly={!!openInfo}
					/>

					{data.kind !== "collection" && data.collection && (
						<Container className="mb-4">
							<PartOf
								name={data.collection.name}
								description={data.collection.description}
								banner={data.collection.banner ?? data.collection.thumbnail}
								href={data.collection.href}
							/>
						</Container>
					)}
				</View>
			)}
			Loader={() => (
				<View className="flex-1">
					<View
						collapsable={false}
						scrollSnapAlign="start"
						style={{ minHeight: hero, marginBottom: overhang }}
					>
						<View
							className="absolute top-0 right-0 left-0 bg-linear-to-b from-transparent to-slate-950/70"
							style={{ height: hero }}
						/>
						<View
							className="sm:absolute sm:right-0 sm:bottom-0 sm:left-0"
							style={{ marginTop: stackedTop }}
						>
							<TitleLine.Loader kind={kind} openInfo={openInfo} />
						</View>
					</View>
					<Description.Loader textOnly={!!openInfo} />
				</View>
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
		with: [
			...(kind !== "collection" ? ["collection", "studios"] : []),
			...(kind === "serie" ? ["firstEntry", "nextEntry"] : []),
			...(kind === "movie" ? ["videos"] : []),
		],
	},
});
