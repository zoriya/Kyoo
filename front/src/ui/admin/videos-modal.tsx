import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import LibraryAdd from "@material-symbols/svg-400/rounded/library_add-fill.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { entryDisplayNumber } from "~/components/entries";
import { Entry, FullVideo, type Page } from "~/models";
import { Button, ComboBox, IconButton, Modal, P, Skeleton } from "~/primitives";
import {
	InfiniteFetch,
	type QueryIdentifier,
	useFetch,
	useMutation,
} from "~/query";
import { useQueryState } from "~/utils";
import { Header } from "../details/header";

export const VideosModal = () => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Header.query("serie", slug));
	const { t } = useTranslation();

	const { mutateAsync: editLinks } = useMutation({
		method: "PUT",
		path: ["api", "videos", "link"],
		compute: ({
			video,
			entries,
		}: {
			video: string;
			entries: Omit<Entry, "href" | "progress" | "videos">[];
		}) => ({
			body: [{ id: video, for: entries.map((x) => ({ slug: x.slug })) }],
		}),
		invalidate: ["api", "series", slug],
		optimisticKey: VideosModal.query(slug),
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
	const { mutateAsync: editGuess } = useMutation({
		method: "PUT",
		path: ["api", "videos"],
		compute: (video: FullVideo) => ({
			body: [
				{
					...video,
					guess: {
						...video.guess,
						title: data?.name ?? slug,
						from: "manual-edit",
						history: [...video.guess.history, video.guess],
					},
					for: video.guess.episodes.map((x) => ({
						serie: slug,
						season: x.season,
						episode: x.episode,
					})),
					entries: undefined,
				},
			],
		}),
		invalidate: ["api", "series", "slug"],
		optimisticKey: VideosModal.query(slug),
		optimistic: (params, prev?: { pages: Page<FullVideo>[] }) => ({
			...prev!,
			pages: prev!.pages.map((p, i) => {
				const idx = p.items.findIndex(
					(x) => params.path.localeCompare(x.path) < 0,
				);
				if (idx !== -1) {
					return {
						...p,
						items: [
							...p.items.slice(0, idx),
							params,
							...p.items.slice(idx, -1),
						],
					};
				}
				if (i === prev!.pages.length) {
					return { ...p, items: [...p.items, params] };
				}
				return p;
			}),
		}),
	});

	return (
		<Modal title={data?.name ?? t("misc.loading")} scroll={false}>
			<InfiniteFetch
				query={VideosModal.query(slug)}
				layout={{ layout: "vertical", gap: 8, numColumns: 1, size: 48 }}
				Render={({ item }) => (
					<View className="h-12 flex-row items-center justify-between hover:bg-card">
						<P>{item.path}</P>
						<View className="flex-row">
							<ComboBox
								multiple
								label={t("show.videos-map-none")}
								searchPlaceholder={t("navbar.search")}
								values={item.entries}
								query={(q) => ({
									parser: Entry,
									path: ["api", "series", slug, "entries"],
									params: {
										query: q,
									},
									infinite: true,
								})}
								getKey={(x) => x.id}
								getLabel={(x) => `${entryDisplayNumber(x)} - ${x.name}`}
								getSmallLabel={entryDisplayNumber}
								onValueChange={async (entries) => {
									await editLinks({
										video: item.id,
										entries,
									});
								}}
							/>
							<IconButton icon={Close} onPress={() => {}} />
						</View>
					</View>
				)}
				Loader={() => <Skeleton />}
				Footer={
					<ComboBox
						Trigger={(props) => (
							<Button
								icon={LibraryAdd}
								text={t("show.videos-map-add")}
								className="mt-4"
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
						onValueChange={async (x) => await editGuess(x!)}
					/>
				}
			/>
		</Modal>
	);
};

VideosModal.query = (slug: string): QueryIdentifier<FullVideo> => ({
	parser: FullVideo,
	path: ["api", "series", slug, "videos"],
	params: {
		sort: "path",
	},
	infinite: true,
});
