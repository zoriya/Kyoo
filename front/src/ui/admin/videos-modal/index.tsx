import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { type Entry, FullVideo, type Page } from "~/models";
import { Modal, P } from "~/primitives";
import {
	InfiniteFetch,
	type QueryIdentifier,
	useFetch,
	useMutation,
} from "~/query";
import { useQueryState } from "~/utils";
import { Header } from "../../details/header";
import { AddVideoFooter, VideoListHeader } from "./headers";
import { PathItem } from "./path-item";

export const useEditLinks = (
	slug: string,
	titles: string[],
	sort: "path" | "entry",
) => {
	const { mutateAsync } = useMutation({
		method: "PUT",
		path: ["api", "videos", "link"],
		compute: ({
			video,
			entries,
		}: {
			video: string;
			entries: Omit<Entry, "href" | "progress" | "videos">[];
		}) => ({
			body: [
				{
					id: video,
					for: entries.map((x) =>
						x.kind === "episode" && !x.slug
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
		optimisticKey: VideosModal.query(slug, titles, sort),
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
	return mutateAsync;
};

export const VideosModal = () => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Header.query("serie", slug));
	const { t } = useTranslation();
	const [titles, setTitles] = useState<string[]>([]);
	const [sort, setSort] = useState<"entry" | "path">("path");
	const editLinks = useEditLinks(slug, titles, sort);

	const addTitle = (x: string) => {
		if (!titles.includes(x)) setTitles([...titles, x]);
	};

	return (
		<Modal title={data?.name ?? t("misc.loading")} scroll={false}>
			<InfiniteFetch
				Header={
					<VideoListHeader
						titles={titles}
						removeTitle={(title) =>
							setTitles(titles.filter((x) => x !== title))
						}
						sort={sort}
						setSort={setSort}
					/>
				}
				query={VideosModal.query(slug, titles, sort)}
				layout={{ layout: "vertical", gap: 8, numColumns: 1, size: 48 }}
				Render={({ item }) => (
					<PathItem
						id={item.id}
						path={item.path}
						entries={item.entries as Entry[]}
						guessTitle={item.guess.title}
						guesses={item.guess.episodes}
						serieSlug={slug}
						addTitle={addTitle}
						editLinks={editLinks}
					/>
				)}
				Loader={PathItem.Loader}
				Empty={
					<View className="flex-1">
						<P className="flex-1 self-center">{t("videos-map.no-video")}</P>
					</View>
				}
				Footer={<AddVideoFooter addTitle={addTitle} />}
			/>
		</Modal>
	);
};

VideosModal.query = (
	slug: string,
	titles: string[],
	sort: "path" | "entry",
): QueryIdentifier<FullVideo> => ({
	parser: FullVideo,
	path: ["api", "series", slug, "videos"],
	params: {
		sort: sort === "entry" ? ["entry", "path"] : sort,
		titles: titles,
	},
	infinite: true,
});
