import ArrowDownward from "@material-symbols/svg-400/rounded/arrow_downward.svg";
import ArrowUpward from "@material-symbols/svg-400/rounded/arrow_upward.svg";
import Collection from "@material-symbols/svg-400/rounded/collections_bookmark.svg";
import FilterList from "@material-symbols/svg-400/rounded/filter_list.svg";
import GridView from "@material-symbols/svg-400/rounded/grid_view.svg";
import Movie from "@material-symbols/svg-400/rounded/movie.svg";
import Sort from "@material-symbols/svg-400/rounded/sort.svg";
import TV from "@material-symbols/svg-400/rounded/tv.svg";
import All from "@material-symbols/svg-400/rounded/view_headline.svg";
import ViewList from "@material-symbols/svg-400/rounded/view_list.svg";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import {
	HR,
	Icon,
	IconButton,
	Menu,
	P,
	PressableFeedback,
	tooltip,
} from "~/primitives";
import { cn } from "~/utils";
import { availableSorts, type SortBy, type SortOrd } from "./types";

const SortTrigger = ({
	sortBy,
	className,
	...props
}: { sortBy: SortBy } & PressableProps) => {
	const { t } = useTranslation();

	return (
		<PressableFeedback
			className={cn("flex-row items-center", className)}
			{...tooltip(t("browse.sortby-tt"))}
			{...props}
		>
			<Icon icon={Sort} className="mx-1" />
			<P>{t(`browse.sortkey.${sortBy}`)}</P>
		</PressableFeedback>
	);
};

const MediaTypeIcons = {
	all: All,
	movie: Movie,
	serie: TV,
	collection: Collection,
};

const MediaTypeTrigger = ({
	mediaType,
	className,
	...props
}: PressableProps & { mediaType: keyof typeof MediaTypeIcons }) => {
	const { t } = useTranslation();

	return (
		<PressableFeedback
			className={cn("flex-row items-center", className)}
			{...tooltip(t("browse.mediatype-tt"))}
			{...props}
		>
			<Icon icon={MediaTypeIcons[mediaType] ?? FilterList} className="mx-1" />
			<P>
				{t(
					mediaType !== "all"
						? `browse.mediatypekey.${mediaType}`
						: "browse.mediatypelabel",
				)}
			</P>
		</PressableFeedback>
	);
};

export const BrowseSettings = ({
	sortBy,
	sortOrd,
	setSort,
	filter,
	setFilter,
	layout,
	setLayout,
}: {
	sortBy: SortBy;
	sortOrd: SortOrd;
	setSort: (sort: SortBy, ord: SortOrd) => void;
	filter: string;
	setFilter: (filter: string) => void;
	layout: "grid" | "list";
	setLayout: (layout: "grid" | "list") => void;
}) => {
	const { t } = useTranslation();

	// TODO: have a proper filter frontend
	const mediaType = /kind eq (\w+)/.exec(filter)?.[1] ?? "all";
	const setMediaType = (kind: string) =>
		setFilter(kind !== "all" ? `kind eq ${kind}` : "");

	return (
		<View className="mx-8 my-2 flex-row items-center justify-between">
			<Menu
				Trigger={MediaTypeTrigger}
				mediaType={mediaType as keyof typeof MediaTypeIcons}
			>
				{Object.keys(MediaTypeIcons).map((x) => (
					<Menu.Item
						key={x}
						label={t(`browse.mediatypekey.${x as keyof typeof MediaTypeIcons}`)}
						selected={mediaType === x}
						icon={MediaTypeIcons[x as keyof typeof MediaTypeIcons]}
						onSelect={() => setMediaType(x)}
					/>
				))}
			</Menu>
			<View className="flex-row">
				<Menu Trigger={SortTrigger} sortBy={sortBy}>
					{availableSorts.map((x) => (
						<Menu.Item
							key={x}
							label={t(`browse.sortkey.${x}`)}
							selected={sortBy === x}
							icon={sortOrd === "asc" ? ArrowUpward : ArrowDownward}
							onSelect={() =>
								setSort(x, sortBy === x && sortOrd === "asc" ? "desc" : "asc")
							}
						/>
					))}
				</Menu>
				<HR orientation="vertical" />
				<IconButton
					icon={GridView}
					onPress={() => setLayout("grid")}
					className="m-1"
					iconClassName={cn(
						layout === "grid" && "fill-accent dark:fill-accent",
					)}
					{...tooltip(t("browse.switchToGrid"))}
				/>
				<IconButton
					icon={ViewList}
					onPress={() => setLayout("list")}
					className="m-1"
					iconClassName={cn(
						layout === "list" && "fill-accent dark:fill-accent",
					)}
					{...tooltip(t("browse.switchToList"))}
				/>
			</View>
		</View>
	);
};
