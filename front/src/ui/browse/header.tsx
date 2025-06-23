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
import { useYoshiki } from "yoshiki/native";
import {
	HR,
	Icon,
	IconButton,
	Menu,
	P,
	PressableFeedback,
	tooltip,
	ts,
} from "~/primitives";
import { availableSorts, type SortBy, type SortOrd } from "./types";

const SortTrigger = ({
	sortBy,
	...props
}: { sortBy: SortBy } & PressableProps) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<PressableFeedback
			{...css({ flexDirection: "row", alignItems: "center" }, props as any)}
			{...tooltip(t("browse.sortby-tt"))}
		>
			<Icon icon={Sort} {...css({ paddingX: ts(0.5) })} />
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
	...props
}: PressableProps & { mediaType: keyof typeof MediaTypeIcons }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<PressableFeedback
			{...css({ flexDirection: "row", alignItems: "center" }, props as any)}
			{...tooltip(t("browse.mediatype-tt"))}
		>
			<Icon
				icon={MediaTypeIcons[mediaType] ?? FilterList}
				{...css({ paddingX: ts(0.5) })}
			/>
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
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();

	// TODO: have a proper filter frontend
	const mediaType = /kind eq (\w+)/.exec(filter)?.[1] ?? "all";
	const setMediaType = (kind: string) =>
		setFilter(kind !== "all" ? `kind eq ${kind}` : "");

	return (
		<View
			{...css({
				flexDirection: "row-reverse",
				alignItems: "center",
				marginX: ts(4),
				marginY: ts(1),
			})}
		>
			<View {...css({ flexDirection: "row" })}>
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
					color={layout === "grid" ? theme.accent : undefined}
					{...tooltip(t("browse.switchToGrid"))}
					{...css({ padding: ts(0.5), marginY: "auto" })}
				/>
				<IconButton
					icon={ViewList}
					onPress={() => setLayout("list")}
					color={layout === "list" ? theme.accent : undefined}
					{...tooltip(t("browse.switchToList"))}
					{...css({ padding: ts(0.5), marginY: "auto" })}
				/>
			</View>
			<View
				{...css({ flexGrow: 1, flexDirection: "row", alignItems: "center" })}
			>
				<Menu
					Trigger={MediaTypeTrigger}
					mediaType={mediaType as keyof typeof MediaTypeIcons}
				>
					{Object.keys(MediaTypeIcons).map((x) => (
						<Menu.Item
							key={x}
							label={t(
								`browse.mediatypekey.${x as keyof typeof MediaTypeIcons}`,
							)}
							selected={mediaType === x}
							icon={MediaTypeIcons[x as keyof typeof MediaTypeIcons]}
							onSelect={() => setMediaType(x)}
						/>
					))}
				</Menu>
			</View>
		</View>
	);
};
