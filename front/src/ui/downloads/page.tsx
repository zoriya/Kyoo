import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { entryDisplayNumber } from "~/components/entries";
import { ItemProgress } from "~/components/items/item-grid";
import { humanFileSize } from "~/models";
import {
	Container,
	H1,
	H3,
	HR,
	Link,
	P,
	Poster,
	PosterBackground,
	SubP,
	ThumbnailBackground,
} from "~/primitives";
import { type Download, useDownloadPercent, useDownloads } from "~/ui/download";
import { EmptyView } from "~/ui/empty-view";
import { cn } from "~/utils";
import { DownloadButton } from "./button";

const DownloadLine = ({ download }: { download: Download }) => {
	const { t } = useTranslation();
	const { video } = download;
	const percent = useDownloadPercent(download);
	const entry = video.entries?.[0];
	const movie = video.show?.kind === "movie" ? video.show : null;
	const Background = movie ? PosterBackground : ThumbnailBackground;

	return (
		<Link
			href={download.status === "done" ? `/watch/${download.slug}` : null}
			className="group flex-row items-center rounded p-1"
		>
			<Background
				src={movie?.poster ?? entry?.thumbnail ?? video.show?.thumbnail ?? null}
				quality="low"
				alt=""
				className={cn(
					"mr-2 shrink-0 rounded",
					movie ? "w-12" : "w-1/4 max-w-60",
					"ring-accent group-highlighted:ring-3",
					download.status !== "done" && "opacity-50",
				)}
			>
				{download.status === "downloading" && (
					<ItemProgress watchPercent={percent} />
				)}
			</Background>
			<View className="flex-1">
				<P numberOfLines={2} className="group-highlighted:underline">
					{movie
						? movie.name
						: entry
							? [entryDisplayNumber(entry), entry.name]
									.filter((x) => x)
									.join(" · ")
							: video.path}
				</P>
				<SubP>
					{[
						t(`downloads.status.${download.status}`),
						video.part !== null ? t("show.part", { number: video.part }) : null,
						download.quality === "original"
							? t("downloads.original")
							: download.quality,
						download.size !== null ? humanFileSize(download.size) : null,
					]
						.filter((x) => x)
						.join(" · ")}
				</SubP>
			</View>
			<DownloadButton videos={[download]} />
		</Link>
	);
};

export const DownloadsPage = () => {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const downloads = [...useDownloads()].sort(
		(a, b) =>
			(a.video.entries?.[0]?.order ?? 0) - (b.video.entries?.[0]?.order ?? 0),
	);
	const shows = Map.groupBy(downloads, (x) => x.video.show?.id ?? x.id);

	return (
		<ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
			<Container className="py-4">
				<H1 className="text-3xl">{t("downloads.title")}</H1>
				{downloads.length === 0 && <EmptyView message={t("downloads.empty")} />}
				{[...shows.values()].map((items, i) => {
					const show = items[0].video.show;
					return (
						<View key={show?.id ?? items[0].id}>
							{i > 0 && <HR />}
							{show && show.kind !== "movie" && (
								<Link
									href={`/${show.kind}s/${show.slug}`}
									className="group my-2 flex-row items-center"
								>
									<Poster
										src={show.poster}
										quality="low"
										className="mr-4 w-12 ring-accent group-highlighted:ring-3"
									/>
									<H3 className="flex-1 group-highlighted:underline">
										{show.name}
									</H3>
								</Link>
							)}
							{items.map((x) => (
								<DownloadLine key={x.id} download={x} />
							))}
						</View>
					);
				})}
			</Container>
		</ScrollView>
	);
};
