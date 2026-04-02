import Add from "@material-symbols/svg-400/rounded/add-fill.svg";
import MovieIcon from "@material-symbols/svg-400/rounded/movie-fill.svg";
import OpenInNew from "@material-symbols/svg-400/rounded/open_in_new-fill.svg";
import SearchIcon from "@material-symbols/svg-400/rounded/search-fill.svg";
import TVIcon from "@material-symbols/svg-400/rounded/tv-fill.svg";
import Library from "@material-symbols/svg-400/rounded/video_library-fill.svg";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { type KImage, SearchMovie, SearchSerie, Show } from "~/models";
import {
	CircularProgress,
	HR,
	type Icon,
	IconButton,
	Input,
	Link,
	Modal,
	P,
	PosterBackground,
	Skeleton,
	SubP,
	Tabs,
	tooltip,
} from "~/primitives";
import { InfiniteFetch, type QueryIdentifier, useMutation } from "~/query";
import { cn, getDisplayDate, useQueryState } from "~/utils";
import { EmptyView } from "../empty-view";

const SearchResultItem = ({
	name,
	subtitle,
	poster,
	externalHref,
	onSelect,
	isPending,
}: {
	name: string;
	subtitle: string | null;
	poster: KImage | null;
	externalHref: string | null;
	onSelect: () => void;
	isPending: boolean;
}) => {
	return (
		<Pressable
			onPress={onSelect}
			disabled={isPending}
			className="group items-center p-1 outline-0"
		>
			<PosterBackground
				src={poster}
				quality="medium"
				className={cn(
					"w-full",
					"ring-accent group-hover:ring-3 group-focus-visible:ring-3",
				)}
			>
				{isPending && (
					<View className="absolute inset-0 items-center justify-center bg-black/50">
						<CircularProgress />
					</View>
				)}
				{externalHref && (
					<IconButton
						icon={OpenInNew}
						as={Link}
						href={externalHref}
						iconClassName="h-5 w-5 fill-slate-200 dark:fill-slate-200"
					/>
				)}
			</PosterBackground>
			<P
				numberOfLines={subtitle ? 1 : 2}
				className="text-center group-focus-within:underline group-hover:underline"
			>
				{name}
			</P>
			{subtitle && <SubP className="text-center">{subtitle}</SubP>}
		</Pressable>
	);
};

SearchResultItem.Loader = () => {
	return (
		<View className="w-full items-center p-1">
			<View className="aspect-2/3 w-full overflow-hidden rounded">
				<Skeleton variant="custom" className="h-full w-full" />
			</View>
			<Skeleton className="mt-1" />
			<Skeleton className="w-1/2" />
		</View>
	);
};

const AddHeader = ({
	query,
	setQuery,
	kind,
	setKind,
	allowLibrary,
}: {
	query: string;
	setQuery: (q: string) => void;
	kind: "library" | "movie" | "serie";
	setKind: (k: "library" | "movie" | "serie") => void;
	allowLibrary: boolean;
}) => {
	const { t } = useTranslation();

	return (
		<View className="gap-3 p-4">
			<View className="flex-1 flex-wrap content-center items-center gap-2 sm:flex-row">
				<Input
					value={query}
					onChangeText={setQuery}
					placeholder={t("admin.add.searchPlaceholder")}
					left={
						<IconButton icon={SearchIcon} {...tooltip(t("navbar.search"))} />
					}
					containerClassName="flex-1"
				/>
				<Tabs
					value={kind}
					setValue={setKind}
					tabs={[
						allowLibrary && {
							icon: Library,
							label: t("admin.add.library"),
							value: "library",
						},
						{
							icon: MovieIcon,
							label: t("admin.add.movies"),
							value: "movie",
						},
						{
							icon: TVIcon,
							label: t("admin.add.series"),
							value: "serie",
						},
					]}
				/>
			</View>
			<HR />
		</View>
	);
};

export const AddPage = ({
	title,
	icon,
	allowLibrary,
	initialKind,
	onSearchSelect,
	videos = [],
}: {
	title?: string;
	icon?: Icon;
	allowLibrary: boolean;
	initialKind?: "movie" | "serie" | "library";
	onSearchSelect?: (item: SearchMovie | SearchSerie) => Promise<void>;
	videos: {
		id: string;
		episodes: { season: number | null; episode: number }[];
	}[];
}) => {
	const { t } = useTranslation();
	const router = useRouter();
	const [query, setQuery] = useQueryState("q", "");
	const [kind, setKind] = useQueryState<"movie" | "serie" | "library">(
		"kind",
		initialKind ?? (allowLibrary ? "library" : "movie"),
	);
	const [selected, setSelected] = useState<string | null>(null);

	const addShow = useMutation({
		method: "POST",
		path: ["scanner", kind === "movie" ? "movies" : "series"],
		compute: (item: SearchMovie | SearchSerie) => ({
			body: {
				title: item.name,
				year:
					"airDate" in item
						? item.airDate?.getFullYear()
						: item.startAir?.getFullYear(),
				externalId: Object.fromEntries(
					Object.entries(item.externalId).map(([k, v]) => [k, v[0].dataId]),
				),
				videos: videos,
			},
		}),
		invalidate: null,
	});
	const matchExisting = useMutation({
		method: "PUT",
		path: ["api", "videos", "link"],
		compute: (item: Show) => ({
			body: videos.map((x) => ({
				id: x.id,
				for:
					item.kind === "serie"
						? x.episodes.map((ep) => {
								if (!ep.season)
									return { serie: item.slug, special: ep.episode };
								return {
									serie: item.slug,
									season: ep.season,
									episode: ep.episode,
								};
							})
						: [{ movie: item.slug }],
			})),
		}),
		invalidate: ["api", "videos", "unmatched"],
	});

	if (kind !== "library" && query.length === 0) {
		return (
			<Modal icon={icon ?? Add} title={title ?? t("admin.add.title")}>
				<AddHeader
					query={query}
					setQuery={setQuery}
					kind={kind}
					setKind={setKind}
					allowLibrary={allowLibrary}
				/>
				<P className="self-center py-8 text-center">
					{t("admin.add.typeToSearch")}
				</P>
			</Modal>
		);
	}

	return (
		<Modal
			icon={icon ?? Add}
			title={title ?? t("admin.add.title")}
			scroll={false}
		>
			<InfiniteFetch
				layout={{
					layout: "grid",
					gap: 8,
					numColumns: { xs: 2, sm: 3, md: 4 },
					size: 200,
				}}
				query={
					(kind === "library"
						? AddPage.libraryQuery(query)
						: AddPage.query(kind, query)) as QueryIdentifier<
						SearchMovie | SearchSerie | Show
					>
				}
				Header={
					<AddHeader
						query={query}
						setQuery={setQuery}
						kind={kind}
						setKind={setKind}
						allowLibrary={allowLibrary}
					/>
				}
				Empty={<EmptyView message={t("admin.add.noResults")} />}
				Render={({ item }) => (
					<SearchResultItem
						name={item.name}
						subtitle={getDisplayDate(item)}
						poster={
							typeof item.poster === "string"
								? {
										id: item.poster,
										source: item.poster,
										blurhash: "",
										low: item.poster,
										medium: item.poster,
										high: item.poster,
									}
								: item.poster
						}
						externalHref={
							item.kind.startsWith("search")
								? Object.values(item.externalId)
										.flatMap((ids) => ids.map((x) => x.link))
										.filter((x) => x)[0]
								: null
						}
						onSelect={async () => {
							setSelected(item.id);
							if (item.kind.startsWith("search")) {
								if (onSearchSelect)
									await onSearchSelect(item as SearchMovie | SearchSerie);
								else
									await addShow.mutateAsync(item as SearchMovie | SearchSerie);
							} else {
								await matchExisting.mutateAsync(item as Show);
							}
							setSelected(null);
							if (router.canGoBack()) router.back();
						}}
						isPending={selected === item.id}
					/>
				)}
				Loader={SearchResultItem.Loader}
			/>
		</Modal>
	);
};

AddPage.query = (
	kind: "movie" | "serie",
	query: string,
): QueryIdentifier<SearchMovie | SearchSerie> => ({
	parser: kind === "movie" ? SearchMovie : SearchSerie,
	path: ["scanner", kind === "movie" ? "movies" : "series"],
	params: {
		query: query,
	},
	infinite: true,
	enabled: query.length > 0,
});

AddPage.libraryQuery = (query: string): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["api", "shows"],
	params: {
		query: query,
	},
	infinite: true,
});
