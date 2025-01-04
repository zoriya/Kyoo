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

import {
	type Audio,
	type QueryIdentifier,
	type Subtitle,
	type Video,
	type WatchInfo,
	WatchInfoP,
} from "@kyoo/models";
import { Button, HR, P, Popup, Skeleton } from "@kyoo/primitives";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { Fetch } from "../fetch";
import { useDisplayName } from "../utils";

const formatBitrate = (b: number) => `${(b / 1000000).toFixed(2)} Mbps`;

const MediaInfoTable = ({
	mediaInfo: { path, videos, container, audios, subtitles, duration, size },
}: {
	mediaInfo: Partial<WatchInfo>;
}) => {
	const getDisplayName = useDisplayName();
	const { t } = useTranslation();
	const { css } = useYoshiki();

	const formatTrackTable = (trackTable: (Audio | Subtitle)[], type: "subtitles" | "audio") => {
		if (trackTable.length === 0) {
			return undefined;
		}
		const singleTrack = trackTable.length === 1;
		return trackTable.reduce(
			(collected, track, index) => {
				// If there is only one track, we do not need to show an index
				collected[singleTrack ? t(`mediainfo.${type}`) : `${t(`mediainfo.${type}`)} ${index + 1}`] =
					[
						getDisplayName(track),
						// Only show it if there is more than one track
						track.isDefault && !singleTrack ? t("mediainfo.default") : undefined,
						track.isForced ? t("mediainfo.forced") : undefined,
						"isHearingImpaired" in track && track.isHearingImpaired
							? t("mediainfo.hearing-impaired")
							: undefined,
						"isExternal" in track && track.isExternal ? t("mediainfo.external") : undefined,
						track.codec,
					]
						.filter((x) => x !== undefined)
						.join(" - ");
				return collected;
			},
			{} as Record<string, string | undefined>,
		);
	};
	const formatVideoTable = (trackTable: Video[]) => {
		if (trackTable.length === 0) {
			return { [t("mediainfo.video")]: t("mediainfo.novideo") };
		}
		const singleTrack = trackTable.length === 1;
		return trackTable.reduce(
			(collected, video, index) => {
				// If there is only one track, we do not need to show an index
				collected[singleTrack ? t("mediainfo.video") : `${t("mediainfo.video")} ${index + 1}`] = [
					getDisplayName(video),
					`${video.width}x${video.height} (${video.quality})`,
					formatBitrate(video.bitrate),
					// Only show it if there is more than one track
					video.isDefault && !singleTrack ? t("mediainfo.default") : undefined,
					video.codec,
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
			videos === undefined ? { [t("mediainfo.video")]: undefined } : formatVideoTable(videos),
			audios === undefined
				? { [t("mediainfo.audio")]: undefined }
				: formatTrackTable(audios, "audio"),
			subtitles === undefined
				? { [t("mediainfo.subtitles")]: undefined }
				: formatTrackTable(subtitles, "subtitles"),
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
