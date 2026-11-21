import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Entry } from "~/models";
import {
	HR,
	Icon,
	IconButton,
	Link,
	P,
	Popup,
	SubP,
	tooltip,
} from "~/primitives";
import { DownloadButton, useDownloadAction } from "~/ui/downloads/button";

export type EntrySelectEntry = {
	displayNumber: string | null;
	name: string | null;
	videos: Entry["videos"];
	download?: boolean;
};

const VideoRow = ({
	video,
	download,
}: {
	video: NonNullable<Entry["videos"]>[number];
	download?: boolean;
}) => {
	const { t } = useTranslation();
	const action = useDownloadAction([video.slug]);

	return (
		<View className="group flex-row items-center gap-2 rounded p-2 highlighted:bg-popover">
			<Link
				href={download ? null : `/watch/${video.slug}`}
				onPress={download ? action.onPress : undefined}
				// same highlight as the menu items, a remote has no hover to see where it is
				className="flex-1 flex-row items-center gap-2 overflow-hidden rounded p-1 outline-0"
			>
				<Icon
					icon={download ? action.icon : PlayArrow}
					className="shrink-0 group-highlighted:fill-slate-200"
				/>
				<View className="flex-1">
					<P className="group-highlighted:text-slate-200">{video.path}</P>
					<SubP className="group-highlighted:text-slate-200">
						{[
							t("show.version", { number: video.version }),
							video.part !== null
								? t("show.part", { number: video.part })
								: null,
						]
							.filter((s) => s != null)
							.join(" · ")}
					</SubP>
				</View>
			</Link>
			{!download && <DownloadButton videos={[video]} />}
			<IconButton
				icon={MovieInfo}
				as={Link}
				href={`/info/${video.slug}`}
				{...tooltip(t("home.episodeMore.mediainfo"))}
			/>
		</View>
	);
};

export const EntrySelect = ({
	entry,
	onClose,
}: {
	entry: EntrySelectEntry | null;
	onClose: () => void;
}) => {
	if (!entry) return null;
	return (
		<Popup
			title={[entry.displayNumber, entry.name].filter((x) => x).join(" · ")}
			close={onClose}
		>
			{[...Map.groupBy(entry.videos ?? [], (v) => v.rendering).entries()].map(
				([rendering, items], i) => (
					<Fragment key={rendering}>
						{i > 0 && <HR />}
						{items.map((x) => (
							<VideoRow key={x.slug} video={x} download={entry.download} />
						))}
					</Fragment>
				),
			)}
		</Popup>
	);
};
