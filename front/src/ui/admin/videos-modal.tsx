import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import Question from "@material-symbols/svg-400/rounded/question_mark-fill.svg";
import LibraryAdd from "@material-symbols/svg-400/rounded/library_add-fill.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { entryDisplayNumber } from "~/components/entries";
import { Entry, FullVideo, type Page } from "~/models";
import {
	Button,
	ComboBox,
	IconButton,
	Modal,
	P,
	Skeleton,
	tooltip,
} from "~/primitives";
import {
	InfiniteFetch,
	type QueryIdentifier,
	useFetch,
	useMutation,
} from "~/query";
import { useQueryState } from "~/utils";
import { Header } from "../details/header";
import { uniqBy } from "~/utils";

export const VideosModal = () => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Header.query("serie", slug));
	const { t } = useTranslation();
	const [titles, setTitles] = useState<string[]>([]);

	const { mutateAsync: editLinks } = useMutation({
		method: "PUT",
		path: ["api", "videos", "link"],
		compute: ({
			video,
			entries,
			guess = false,
		}: {
			video: string;
			entries: Omit<Entry, "href" | "progress" | "videos">[];
			guess?: boolean;
		}) => ({
			body: [
				{
					id: video,
					for: entries.map((x) =>
						guess && x.kind === "episode"
							? {
									serie: slug,
									// @ts-expect-error: idk why it couldn't match x as an episode
									season: x.seasonNumber,
									// @ts-expect-error: idk why it couldn't match x as an episode
									episode: x.episodeNumber,
								}
							: { slug: x.slug },
					),
				},
			],
		}),
		invalidate: ["api", "series", slug],
		optimisticKey: VideosModal.query(slug, null),
		optimistic: (params, prev?: { pages: Page<FullVideo>[] }) => ({
			...prev!,
			pages: prev!.pages.map((p) => ({
				...p,
				items: p!.items.map((x) => {
					if (x.id !== params.video) return x;
					return { ...x, entries: params.entries };
				}) as FullVideo[],
			})),
		}),
	});

	return (
		<Modal title={data?.name ?? t("misc.loading")} scroll={false}>
			{[...titles].map((title) => (
				<View
					key={title}
					className="m-2 flex-row items-center justify-between rounded bg-card px-6"
				>
					<P>{t("show.videos-map-related", { title })}</P>
					<IconButton
						icon={Close}
						onPress={() => {
							setTitles(titles.filter((x) => x !== title));
						}}
						{...tooltip(t("misc.cancel"))}
					/>
				</View>
			))}
			<InfiniteFetch
				query={VideosModal.query(slug, titles)}
				layout={{ layout: "vertical", gap: 8, numColumns: 1, size: 48 }}
				Render={({ item }) => {
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
							className="mx-6 h-12 flex-row items-center justify-between hover:bg-card"
							style={!saved && { opacity: 0.6 }}
						>
							<View className="flex-row items-center">
								{saved ? (
									<IconButton
										icon={Close}
										onPress={async () => {
											if (!titles.includes(item.guess.title))
												setTitles([...titles, item.guess.title]);
											await editLinks({ video: item.id, entries: [] });
										}}
										{...tooltip(t("show.videos-map-delete"))}
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
										{...tooltip(t("show.videos-map-validate"))}
									/>
								) : (
									<IconButton
										disabled
										icon={Question}
										{...tooltip(t("show.videos-map-no-guess"))}
									/>
								)}
								<P>{item.path}</P>
							</View>
							<ComboBox
								multiple
								label={t("show.videos-map-none")}
								searchPlaceholder={t("navbar.search")}
								values={saved ? item.entries : guess}
								query={(q) => ({
									parser: Entry,
									path: ["api", "series", slug, "entries"],
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
									if (!entries.length && !titles.includes(item.guess.title))
										setTitles([...titles, item.guess.title]);
									await editLinks({
										video: item.id,
										entries,
									});
								}}
							/>
						</View>
					);
				}}
				Loader={() => <Skeleton />}
				Footer={
					<ComboBox
						Trigger={(props) => (
							<Button
								icon={LibraryAdd}
								text={t("show.videos-map-add")}
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
							if (x && !titles.includes(x.guess.title))
								setTitles([...titles, x.guess.title]);
						}}
					/>
				}
			/>
		</Modal>
	);
};

VideosModal.query = (
	slug: string,
	titles: string[] | null,
): QueryIdentifier<FullVideo> => ({
	parser: FullVideo,
	path: ["api", "series", slug, "videos"],
	params: {
		sort: "path",
		titles: titles ?? undefined,
	},
	infinite: true,
});
