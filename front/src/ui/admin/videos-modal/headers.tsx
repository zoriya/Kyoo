import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import Path from "@material-symbols/svg-400/rounded/conversion_path-fill.svg";
import LibraryAdd from "@material-symbols/svg-400/rounded/library_add-fill.svg";
import Sort from "@material-symbols/svg-400/rounded/sort.svg";
import Entry from "@material-symbols/svg-400/rounded/tv_next-fill.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { FullVideo } from "~/models";
import {
	Button,
	ComboBox,
	Icon,
	IconButton,
	Menu,
	P,
	PressableFeedback,
	tooltip,
} from "~/primitives";

const sortModes = [
	["path", Path],
	["entry", Entry],
] as const;

export const SortMenu = ({
	sort,
	setSort,
}: {
	sort: "path" | "entry";
	setSort: (sort: "path" | "entry") => void;
}) => {
	const { t } = useTranslation();
	return (
		<Menu
			Trigger={(props) => (
				<PressableFeedback
					className="flex-row items-center"
					{...tooltip(t("browse.sortby-tt"))}
					{...props}
				>
					<Icon icon={Sort} className="mx-1" />
					<P>{t(`videos-map.sort-${sort}`)}</P>
				</PressableFeedback>
			)}
		>
			{sortModes.map((x) => (
				<Menu.Item
					key={x[0]}
					icon={x[1]}
					label={t(`videos-map.sort-${x[0]}`)}
					selected={sort === x[0]}
					onSelect={() => setSort(x[0])}
				/>
			))}
		</Menu>
	);
};

export const VideoListHeader = ({
	titles,
	removeTitle,
	sort,
	setSort,
}: {
	titles: string[];
	removeTitle: (title: string) => void;
	sort: "path" | "entry";
	setSort: (sort: "path" | "entry") => void;
}) => {
	const { t } = useTranslation();

	return (
		<>
			{[...titles].map((title) => (
				<View
					key={title}
					className="m-2 flex-row items-center justify-between rounded bg-card px-6"
				>
					<P>{t("videos-map.related", { title })}</P>
					<IconButton
						icon={Close}
						onPress={() => removeTitle(title)}
						{...tooltip(t("misc.cancel"))}
					/>
				</View>
			))}
			<View className="mx-6 mb-6 flex-row items-center">
				<SortMenu sort={sort} setSort={setSort} />
			</View>
		</>
	);
};

export const AddVideoFooter = ({
	addTitle,
}: {
	addTitle: (title: string) => void;
}) => {
	const { t } = useTranslation();

	return (
		<ComboBox
			Trigger={(props) => (
				<Button
					icon={LibraryAdd}
					text={t("videos-map.add")}
					className="m-6 mt-10"
					onPress={props.onPress ?? (props as any).onClick}
					{...props}
				/>
			)}
			searchPlaceholder={t("navbar.search")}
			value={null}
			query={(q) => ({
				parser: FullVideo,
				path: ["api", "videos"],
				params: {
					query: q,
					sort: "path",
				},
				infinite: true,
			})}
			getKey={(x) => x.id}
			getLabel={(x) => x.path}
			onValueChange={(x) => {
				if (x) addTitle(x.guess.title);
			}}
		/>
	);
};
