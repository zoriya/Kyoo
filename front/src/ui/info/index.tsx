import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { VideoInfo } from "~/models";
import { HR, P, Skeleton } from "~/primitives";
import { type QueryIdentifier, useFetch } from "~/query";
import { useDisplayName } from "~/track-utils";
import { useQueryState } from "~/utils";
import { ErrorView } from "../errors";

const formatBitrate = (b: number) => `${(b / 1000000).toFixed(2)} Mbps`;

const Row = ({ label, value }: { label: string; value: string }) => {
	const { css } = useYoshiki();

	return (
		<View {...css({ flexDirection: "row" })}>
			<P {...css({ flex: 1 })}>{label}</P>
			<P {...css({ flex: 3 })}>{value}</P>
		</View>
	);
};

Row.Loading = ({ label }: { label: string }) => {
	const { css } = useYoshiki();

	return (
		<View {...css({ flexDirection: "row" })}>
			<P {...css({ flex: 1 })}>{label}</P>
			<Skeleton {...css({ flex: 3 })} />
		</View>
	);
};

export const Info = () => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data, error } = useFetch(Info.infoQuery(slug));
	const { t } = useTranslation();
	const getDisplayName = useDisplayName();

	if (error) return <ErrorView error={error} />;
	if (!data) return <Info.Loading />;

	return (
		<View>
			<Row
				label={t("mediainfo.file")}
				value={data.path.replace(/^\/video\//, "")}
			/>
			<Row
				label={t("mediainfo.container")}
				value={data.container ?? t("mediainfo.nocontainer")}
			/>
			<Row label={t("mediainfo.duration")} value={data.duration} />
			<Row label={t("mediainfo.size")} value={data.size} />
			<HR />
			{data.videos.length === 0 ? (
				<Row label={t("mediainfo.video")} value={t("mediainfo.novideo")} />
			) : (
				data.videos.map((x) => (
					<Row
						key={x.index}
						label={
							data.videos.length === 1
								? t("mediainfo.video")
								: `${t("mediainfo.video")} ${x.index}`
						}
						value={[
							getDisplayName(x),
							`${x.width}x${x.height}`,
							formatBitrate(x.bitrate),
							// Only show it if there is more than one track
							x.isDefault && data.videos.length > 1
								? t("mediainfo.default")
								: undefined,
							x.codec,
						]
							.filter((x) => x)
							.join(" - ")}
					/>
				))
			)}
			<HR />
			{data.audios.map((x, i) => (
				<Row
					key={x.index}
					label={
						data.audios.length === 1
							? t("mediainfo.audio")
							: `${t("mediainfo.audio")} ${i + 1}`
					}
					value={[
						getDisplayName(x),
						// Only show it if there is more than one track
						x.isDefault && data.audios.length > 0
							? t("mediainfo.default")
							: undefined,
						x.codec,
					]
						.filter((x) => x)
						.join(" - ")}
				/>
			))}
			<HR />
			{data.subtitles.map((x, i) => (
				<Row
					key={x.index}
					label={
						data.subtitles.length === 1
							? t("mediainfo.subtitles")
							: `${t("mediainfo.subtitles")} ${i + 1}`
					}
					value={[
						getDisplayName(x),
						// Only show it if there is more than one track
						x.isDefault && data.subtitles.length > 0
							? t("mediainfo.default")
							: undefined,
						x.isForced ? t("mediainfo.forced") : undefined,
						"isHearingImpaired" in x && x.isHearingImpaired
							? t("mediainfo.hearing-impaired")
							: undefined,
						"isExternal" in x && x.isExternal
							? t("mediainfo.external")
							: undefined,
						x.codec,
					]
						.filter((x) => x)
						.join(" - ")}
				/>
			))}
		</View>
	);
};

Info.Loading = () => {
	const { t } = useTranslation();

	return (
		<View>
			<Row.Loading label={t("mediainfo.file")} />
			<Row.Loading label={t("mediainfo.container")} />
			<Row.Loading label={t("mediainfo.duration")} />
			<Row.Loading label={t("mediainfo.size")} />
			<HR />
			<Row.Loading label={t("mediainfo.video")} />
			<HR />
			<Row.Loading label={t("mediainfo.audio")} />
			<HR />
			<Row.Loading label={t("mediainfo.subtitles")} />
		</View>
	);
};

Info.infoQuery = (slug: string): QueryIdentifier<VideoInfo> => ({
	path: ["api", "videos", slug, "info"],
	parser: VideoInfo,
});
