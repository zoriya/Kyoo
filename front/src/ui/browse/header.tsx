import ArrowDownward from "@material-symbols/svg-400/rounded/arrow_downward.svg";
import ArrowUpward from "@material-symbols/svg-400/rounded/arrow_upward.svg";
import Check from "@material-symbols/svg-400/rounded/check.svg";
import CloseIcon from "@material-symbols/svg-400/rounded/close.svg";
import Collection from "@material-symbols/svg-400/rounded/collections_bookmark.svg";
import FilterList from "@material-symbols/svg-400/rounded/filter_list.svg";
import GridView from "@material-symbols/svg-400/rounded/grid_view.svg";
import Movie from "@material-symbols/svg-400/rounded/movie.svg";
import Person from "@material-symbols/svg-400/rounded/person.svg";
import Sort from "@material-symbols/svg-400/rounded/sort.svg";
import TheaterComedy from "@material-symbols/svg-400/rounded/theater_comedy.svg";
import TV from "@material-symbols/svg-400/rounded/tv.svg";
import All from "@material-symbols/svg-400/rounded/view_headline.svg";
import ViewList from "@material-symbols/svg-400/rounded/view_list.svg";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { Genre, Staff, Studio } from "~/models";
import {
	ComboBox,
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

const FilterTrigger = ({
	label,
	count,
	icon,
	className,
	...props
}: {
	label: string;
	count: number;
	icon?: ComponentType<SvgProps>;
} & PressableProps) => {
	return (
		<PressableFeedback
			className={cn("flex-row items-center", className)}
			{...props}
		>
			<Icon icon={icon ?? FilterList} className="mx-1" />
			<P>{count > 0 ? `${label} (${count})` : label}</P>
		</PressableFeedback>
	);
};

const FilterChip = ({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) => {
	return (
		<PressableFeedback
			onPress={onRemove}
			className={cn(
				"flex-row items-center gap-1 rounded-4xl border border-accent px-2.5 py-1",
				"bg-accent",
			)}
		>
			<P className="text-slate-200 text-sm dark:text-slate-300">{label}</P>
			<Icon
				icon={CloseIcon}
				className="h-4 w-4 fill-slate-200 dark:fill-slate-300"
			/>
		</PressableFeedback>
	);
};

const parseFilterValues = (filter: string, pattern: RegExp) =>
	Array.from(filter.matchAll(pattern)).map((x) => x[1]);

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

	const mediaType = /kind eq (\w+)/.exec(filter)?.[1] ?? "all";
	const includedGenres = parseFilterValues(
		filter,
		/(?<!not )genres (?:has|eq) ([a-z-]+)/g,
	);
	const excludedGenres = parseFilterValues(
		filter,
		/not genres (?:has|eq) ([a-z-]+)/g,
	);
	const studioSlugs = parseFilterValues(
		filter,
		/studios (?:has|eq) ([a-z0-9-]+)/g,
	);
	const staffSlugs = parseFilterValues(
		filter,
		/staff (?:has|eq) ([a-z0-9-]+)/g,
	);

	const applyFilters = ({
		kind,
		nextIncludedGenres,
		nextExcludedGenres,
		nextStudios,
		nextStaff,
	}: {
		kind?: string;
		nextIncludedGenres?: string[];
		nextExcludedGenres?: string[];
		nextStudios?: string[];
		nextStaff?: string[];
	}) => {
		const clauses: string[] = [];
		// ??= is forbidden by react-compiler (/shrug)
		kind = kind ?? mediaType;
		nextIncludedGenres = nextIncludedGenres ?? includedGenres;
		nextExcludedGenres = nextExcludedGenres ?? excludedGenres;
		nextStudios = nextStudios ?? studioSlugs;
		nextStaff = nextStaff ?? staffSlugs;

		if (kind !== "all") clauses.push(`kind eq ${kind}`);
		for (const studio of nextStudios) clauses.push(`studios has ${studio}`);
		for (const person of nextStaff) clauses.push(`staff has ${person}`);
		for (const genre of nextIncludedGenres) clauses.push(`genres has ${genre}`);
		for (const genre of nextExcludedGenres)
			clauses.push(`not genres has ${genre}`);
		setFilter(clauses.join(" and "));
	};

	return (
		<View>
			<View className="my-2 flex-1 flex-row flex-wrap items-center justify-between sm:mx-8">
				<View className="flex-1 flex-row flex-wrap gap-3">
					<Menu
						Trigger={MediaTypeTrigger}
						mediaType={mediaType as keyof typeof MediaTypeIcons}
					>
						{() => (
							<>
								{Object.keys(MediaTypeIcons).map((x) => (
									<Menu.Item
										key={x}
										label={t(
											`browse.mediatypekey.${x as keyof typeof MediaTypeIcons}`,
										)}
										selected={mediaType === x}
										icon={MediaTypeIcons[x as keyof typeof MediaTypeIcons]}
										onSelect={() => applyFilters({ kind: x })}
									/>
								))}
							</>
						)}
					</Menu>
					<Menu
						Trigger={(props: PressableProps) => (
							<FilterTrigger
								label={t("show.genre")}
								count={includedGenres.length + excludedGenres.length}
								icon={TheaterComedy}
								{...props}
							/>
						)}
					>
						{() => (
							<>
								{Genre.options.map((genre) => {
									const isIncluded = includedGenres.includes(genre);
									const isExcluded = excludedGenres.includes(genre);
									return (
										<Menu.Item
											key={genre}
											label={t(`genres.${genre}`)}
											left={
												<View className="h-6 w-6 items-center justify-center">
													{(isIncluded || isExcluded) && (
														<Icon icon={isExcluded ? CloseIcon : Check} />
													)}
												</View>
											}
											closeOnSelect={false}
											onSelect={() => {
												let nextIncluded = includedGenres;
												let nextExcluded = excludedGenres;
												if (isIncluded) {
													// include -> exclude
													nextIncluded = nextIncluded.filter(
														(g) => g !== genre,
													);
													nextExcluded = [...nextExcluded, genre];
												} else if (isExcluded) {
													// exclude -> neutral
													nextExcluded = nextExcluded.filter(
														(g) => g !== genre,
													);
												} else {
													// neutral -> include
													nextIncluded = [...nextIncluded, genre];
												}
												applyFilters({
													nextIncludedGenres: nextIncluded,
													nextExcludedGenres: nextExcluded,
												});
											}}
										/>
									);
								})}
							</>
						)}
					</Menu>
					<ComboBox
						multiple
						label={t("show.studios")}
						searchPlaceholder={t("navbar.search")}
						Trigger={(props) => (
							<FilterTrigger
								label={t("show.studios")}
								count={studioSlugs.length}
								icon={TV}
								{...props}
							/>
						)}
						query={(search) => ({
							path: ["api", "studios"],
							parser: Studio,
							infinite: true,
							params: {
								query: search,
							},
						})}
						values={studioSlugs.map((x) => ({ slug: x, name: x }))}
						getKey={(studio) => studio.slug}
						getLabel={(studio) => studio.name}
						onValueChange={(items) =>
							applyFilters({ nextStudios: items.map((item) => item.slug) })
						}
					/>
					<ComboBox
						multiple
						label={t("show.staff")}
						searchPlaceholder={t("navbar.search")}
						Trigger={(props) => (
							<FilterTrigger
								label={t("show.staff")}
								count={staffSlugs.length}
								icon={Person}
								{...props}
							/>
						)}
						query={(search) => ({
							path: ["api", "staff"],
							parser: Staff,
							infinite: true,
							params: {
								query: search,
							},
						})}
						values={staffSlugs.map((x) => ({ slug: x, name: x }))}
						getKey={(member) => member.slug}
						getLabel={(member) => member.name}
						onValueChange={(items) =>
							applyFilters({ nextStaff: items.map((item) => item.slug) })
						}
					/>
				</View>
				<View className="flex-row">
					<Menu Trigger={SortTrigger} sortBy={sortBy}>
						{() => (
							<>
								{availableSorts.map((x) => (
									<Menu.Item
										key={x}
										label={t(`browse.sortkey.${x}`)}
										selected={sortBy === x}
										icon={sortOrd === "asc" ? ArrowUpward : ArrowDownward}
										onSelect={() =>
											setSort(
												x,
												sortBy === x && sortOrd === "asc" ? "desc" : "asc",
											)
										}
									/>
								))}
							</>
						)}
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
			{(mediaType !== "all" ||
				includedGenres.length > 0 ||
				excludedGenres.length > 0 ||
				studioSlugs.length > 0 ||
				staffSlugs.length > 0) && (
				<View className="mx-8 mb-2 flex-1 flex-row flex-wrap gap-2">
					{mediaType !== "all" && (
						<FilterChip
							label={t(
								`browse.mediatypekey.${mediaType as keyof typeof MediaTypeIcons}`,
							)}
							onRemove={() => applyFilters({ kind: "all" })}
						/>
					)}
					{includedGenres.map((genre) => (
						<FilterChip
							key={`genre-inc-${genre}`}
							label={t(`genres.${genre as Genre}`)}
							onRemove={() =>
								applyFilters({
									nextIncludedGenres: includedGenres.filter((g) => g !== genre),
								})
							}
						/>
					))}
					{excludedGenres.map((genre) => (
						<FilterChip
							key={`genre-exc-${genre}`}
							label={`${t("browse.not")} ${t(`genres.${genre as Genre}`)}`}
							onRemove={() =>
								applyFilters({
									nextExcludedGenres: excludedGenres.filter((g) => g !== genre),
								})
							}
						/>
					))}
					{studioSlugs.map((studio) => (
						<FilterChip
							key={`studio-${studio}`}
							label={studio}
							onRemove={() =>
								applyFilters({
									nextStudios: studioSlugs.filter((s) => s !== studio),
								})
							}
						/>
					))}
					{staffSlugs.map((staff) => (
						<FilterChip
							key={`staff-${staff}`}
							label={staff}
							onRemove={() =>
								applyFilters({
									nextStaff: staffSlugs.filter((s) => s !== staff),
								})
							}
						/>
					))}
				</View>
			)}
		</View>
	);
};
