import DownloadIcon from "@material-symbols/svg-400/rounded/download.svg";
import HighQuality from "@material-symbols/svg-400/rounded/high_quality.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Quality, VideoInfo } from "~/models";
import { Icon, P, Popup, PressableFeedback, SubP } from "~/primitives";

export const qualityHeights: Record<Exclude<Quality, "original">, number> = {
	"8k": 4320,
	"4k": 2160,
	"1440p": 1440,
	"1080p": 1080,
	"720p": 720,
	"480p": 480,
	"360p": 360,
	"240p": 240,
};

export const availableQualities = (info: VideoInfo): Quality[] => {
	const height =
		(info.videos.find((x) => x.isDefault) ?? info.videos[0])?.height ?? 0;
	return [
		"original",
		...(Object.keys(qualityHeights) as (keyof typeof qualityHeights)[]).filter(
			(x) => qualityHeights[x] <= height,
		),
	];
};

export const QualityPopup = ({
	info,
	onSelect,
	close,
}: {
	info: VideoInfo;
	onSelect: (quality: Quality) => void;
	close: () => void;
}) => {
	const { t } = useTranslation();

	return (
		<Popup icon={HighQuality} title={t("downloads.quality")} close={close}>
			{availableQualities(info).map((x) => (
				<PressableFeedback
					key={x}
					onPress={() => {
						close();
						onSelect(x);
					}}
					className="group flex-row items-center gap-4 rounded p-3 outline-0 highlighted:bg-accent"
				>
					<Icon
						icon={DownloadIcon}
						className="shrink-0 group-highlighted:fill-slate-200"
					/>
					<View className="flex-1">
						<P className="group-highlighted:text-slate-200">
							{x === "original" ? t("downloads.original") : x}
						</P>
						<SubP className="group-highlighted:text-slate-200">
							{x === "original" ? info.size : t("downloads.transcoded")}
						</SubP>
					</View>
				</PressableFeedback>
			))}
		</Popup>
	);
};
