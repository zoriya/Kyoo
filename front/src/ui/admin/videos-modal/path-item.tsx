import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import Question from "@material-symbols/svg-400/rounded/question_mark-fill.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { entryDisplayNumber } from "~/components/entries";
import { Entry, type FullVideo } from "~/models";
import { ComboBox, IconButton, P, Skeleton, tooltip } from "~/primitives";
import { uniqBy } from "~/utils";
import type { useEditLinks } from ".";

export const PathItem = ({
	item,
	serieSlug,
	addTitle,
	editLinks,
}: {
	item: FullVideo;
	serieSlug: string;
	addTitle: (title: string) => void;
	editLinks: ReturnType<typeof useEditLinks>;
}) => {
	const { t } = useTranslation();

	const saved = item.entries.length;
	const guess = !saved
		? uniqBy(
				item.guess.episodes.map(
					(x) =>
						({
							kind: "episode",
							id: `s${x.season}-e${x.episode}`,
							seasonNumber: x.season,
							episodeNumber: x.episode,
						}) as Entry,
				),
				(x) => x.id,
			)
		: [];
	return (
		<View
			className="mx-6 min-h-12 flex-1 flex-row items-center justify-between hover:bg-card"
			style={!saved && { opacity: 0.6 }}
		>
			<View className="flex-1 flex-row items-center pr-1">
				{saved ? (
					<IconButton
						icon={Close}
						onPress={async () => {
							addTitle(item.guess.title);
							await editLinks({ video: item.id, entries: [] });
						}}
						{...tooltip(t("videos-map.delete"))}
					/>
				) : guess.length ? (
					<IconButton
						icon={Check}
						onPress={async () => {
							await editLinks({
								video: item.id,
								entries: guess,
								guess: true,
							});
						}}
						{...tooltip(t("videos-map.validate"))}
					/>
				) : (
					<IconButton
						disabled
						icon={Question}
						{...tooltip(t("videos-map.no-guess"))}
					/>
				)}
				<P className="flex-1 flex-wrap">{item.path}</P>
			</View>
			<ComboBox
				multiple
				label={t("videos-map.none")}
				searchPlaceholder={t("navbar.search")}
				values={saved ? item.entries : guess}
				query={(q) => ({
					parser: Entry,
					path: ["api", "series", serieSlug, "entries"],
					params: {
						query: q,
					},
					infinite: true,
				})}
				getKey={
					saved
						? (x) => x.id
						: (x) =>
								x.kind === "episode"
									? `${x.seasonNumber}-${x.episodeNumber}`
									: x.id
				}
				getLabel={(x) => `${entryDisplayNumber(x)} - ${x.name}`}
				getSmallLabel={entryDisplayNumber}
				onValueChange={async (entries) => {
					if (!entries.length) addTitle(item.guess.title);
					await editLinks({
						video: item.id,
						entries,
					});
				}}
			/>
		</View>
	);
};

PathItem.Loader = () => {
	return (
		<View className="mx-6 min-h-12 flex-1 flex-row items-center justify-between hover:bg-card">
			<View className="flex-1 flex-row items-center pr-1">
				<IconButton icon={Close} />
				<Skeleton className="w-4/5" />
			</View>
			<Skeleton className="w-1/5" />
		</View>
	);
};
