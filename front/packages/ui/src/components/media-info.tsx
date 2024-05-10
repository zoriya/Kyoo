/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { Audio, QueryIdentifier, Subtitle, WatchInfo, WatchInfoP } from "@kyoo/models";
import { Button, HR, P, Popup, Skeleton } from "@kyoo/primitives";
import { Fetch } from "../fetch";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { Fragment } from "react";

const MediaInfoTable = ({
	mediaInfo: { path, video, container, audios, subtitles, duration, size },
}: {
	mediaInfo: Partial<WatchInfo>;
}) => {
	const { t } = useTranslation();
	const { css } = useYoshiki();
	const formatBitrate = (b: number) => `${(b / 1000000).toFixed(2)} Mbps`;
	const formatTrackTable = (trackTable: (Audio | Subtitle)[], s: string) => {
		if (trackTable.length === 0) {
			return undefined;
		}
		const singleTrack = trackTable.length === 1;
		return trackTable.reduce(
			(collected, audioTrack, index) => {
				// If there is only one track, we do not need to show an index
				collected[singleTrack ? t(s) : `${t(s)} ${index + 1}`] = [
					audioTrack.displayName,
					// Only show it if there is more than one track
					audioTrack.isDefault && !singleTrack ? t("mediainfo.default") : undefined,
					audioTrack.isForced ? t("mediainfo.forced") : undefined,
					audioTrack.codec,
				]
					.filter((x) => x !== undefined)
					.join(" - ");
				return collected;
			},
			{} as Record<string, string | undefined>,
		);
	};
	const table = (
		[
			{
				[t("mediainfo.file")]: path?.replace(/^\/video\//, ""),
				[t("mediainfo.container")]: container !== null ? container : t("mediainfo.nocontainer"),
				[t("mediainfo.duration")]: duration,
				[t("mediainfo.size")]: size,
			},
			{
				[t("mediainfo.video")]: video
					? `${video.width}x${video.height} (${video.quality}) - ${formatBitrate(
							video.bitrate,
						)} - ${video.codec}`
					: video === null
						? t("mediainfo.novideo")
						: undefined,
			},
			audios === undefined
				? { [t("mediainfo.audio")]: undefined }
				: formatTrackTable(audios, "mediainfo.audio"),
			subtitles === undefined
				? { [t("mediainfo.subtitles")]: undefined }
				: formatTrackTable(subtitles, "mediainfo.subtitles"),
		] as const
	).filter((x) => x !== undefined) as Record<string, string | undefined>[];
	return (
		<View>
			{table.map((g) =>
				Object.entries(g).map(([label, value], index, l) => (
					<Fragment key={`media-info-${label}`}>
						<View {...css({ flexDirection: "row" })}>
							<View {...css({ flex: 1 })}>
								<P>{label}</P>
							</View>
							<View {...css({ flex: 3 })}>
								<Skeleton>{value ? <P>{value}</P> : undefined}</Skeleton>
							</View>
						</View>
						{index === l.length - 1 && <HR />}
					</Fragment>
				)),
			)}
		</View>
	);
};

export const MediaInfoPopup = ({
	close,
	mediaType,
	mediaSlug,
}: {
	close: () => void;
	mediaType: "episode" | "movie";
	mediaSlug: string;
}) => {
	return (
		<Popup>
			<Fetch query={MediaInfoPopup.query(mediaType, mediaSlug)}>
				{(mediaInfo) => <MediaInfoTable mediaInfo={mediaInfo} />}
			</Fetch>
			<Button text="OK" onPress={() => close()} />
		</Popup>
	);
};

MediaInfoPopup.query = (mediaType: string, mediaSlug: string): QueryIdentifier<WatchInfo> => ({
	path: [mediaType, mediaSlug, "info"],
	parser: WatchInfoP,
});
