import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	InfiniteFetch,
	type QueryIdentifier,
	useCached,
	useMutation,
} from "~/data";
import { type Entry, type Episode, Video } from "~/models";
import { Modal, rem } from "~/primitives";
import { EmptyView } from "~/ui/empty-view";
import { useQueryState } from "~/utils";
import { Header } from "../../details/header";
import { AddVideoFooter, VideoListHeader } from "./headers";
import { PathItem } from "./path-item";

export const useEditLinks = (slug: string) => {
	const { mutate } = useMutation(
		({
			video,
			entries,
		}: {
			video: string;
			entries: Omit<Entry, "href" | "progress" | "videos">[];
		}) => ({
			method: "PUT",
			path: ["api", "videos", "link"],
			body: [
				{
					id: video,
					for: entries.map((x) => {
						if (x.slug) return { slug: x.slug };
						const ep = x as Episode;
						if (!ep.seasonNumber)
							return { serie: slug, special: ep.episodeNumber };
						return {
							serie: slug,
							season: ep.seasonNumber,
							episode: ep.episodeNumber,
						};
					}),
				},
			],
			optimisticSchema: Video,
			optimistic: () => ({ id: video, entries }),
			invalidate: { path: ["api", "series", slug], nested: true },
		}),
	);
	return mutate;
};

export const VideosModal = () => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const serie = useCached(Header.query("serie", slug));
	const { t } = useTranslation();
	const [titles, setTitles] = useState<string[]>([]);
	const [sort, setSort] = useState<"entry" | "path">("path");
	const editLinks = useEditLinks(slug);

	const addTitle = (x: string) => {
		if (!titles.includes(x)) setTitles([...titles, x]);
	};

	return (
		<Modal title={serie?.name ?? slug} scroll={false}>
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
				layout={{ layout: "vertical", gap: 8, numColumns: 1, size: rem(12) }}
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
				Empty={<EmptyView message={t("videos-map.no-video")} />}
				Footer={<AddVideoFooter addTitle={addTitle} />}
			/>
		</Modal>
	);
};

VideosModal.query = (
	slug: string,
	titles: string[],
	sort: "path" | "entry",
): QueryIdentifier<Video> => ({
	schema: Video,
	path: ["api", "series", slug, "videos"],
	params: {
		sort: sort === "entry" ? ["entry", "path"] : sort,
		titles: titles,
	},
	infinite: true,
});
