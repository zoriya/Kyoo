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

import { Audio, Subtitle, WatchInfo, WatchInfoP } from "@kyoo/models";
import { Button, HR, P, Popup, Skeleton } from "@kyoo/primitives";
import { Fetch } from "../fetch";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki";
import { NativeCssFunc } from "yoshiki/src/native/type";

const MediaInfoTable = ({
	mediaInfo: { path, video, container, audios, subtitles },
	css,
}: {
	css: NativeCssFunc;
	mediaInfo: Partial<WatchInfo>;
}) => {
	const { t } = useTranslation();
	const formatBitrate = (b: number) => `${(b / 1000000).toFixed(2)} Mbps`;
	const formatTrackTable = (trackTable: (Audio | Subtitle)[], s: string) => {
		if (trackTable.length == 0) {
			return undefined;
		}
		return trackTable.reduce(
			(collected, audioTrack, index) => ({
				...collected,
				// If there is only one track, we do not need to show an index
				[trackTable.length == 1 ? t(s) : `${t(s)} ${index + 1}`]: [
					audioTrack.displayName,
					audioTrack.isDefault ? t("Default") : undefined,
					audioTrack.isForced ? t("Forced") : undefined,
					audioTrack.codec,
				]
					.filter((x) => x !== undefined)
					.join(" - "),
			}),
			{} as Record<string, string | undefined>,
		);
	};
	const table = (
		[
			{
				[t("mediainfo.file")]: path?.replace(/^\/video\//, ''),
				[t("mediainfo.container")]: container,
			},
			{
				[t("mediainfo.video")]: video
					? `${video.width}x${video.height} (${video.quality}) - ${formatBitrate(
							video.bitrate,
					  )} - ${video.codec}`
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
					<>
						<View key={`media-info-${label}`} {...css({ flexDirection: "row" })}>
							<View {...css({ flex: 1 })}>
								<P>{label}</P>
							</View>
							<View {...css({ flex: 3 })}>
								<Skeleton>{value ? <P>{value}</P> : undefined}</Skeleton>
							</View>
						</View>
						{index == l.length - 1 && <HR />}
					</>
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
	const mediaInfoQuery = {
		path: ["video", mediaType, mediaSlug, "info"],
		parser: WatchInfoP,
	};
	return (
		<Popup>
			{({ css }) => (
				<>
					<Fetch query={mediaInfoQuery}>
						{(mediaInfo) => <MediaInfoTable css={css} mediaInfo={mediaInfo} />}
					</Fetch>
					<Button text="OK" onPress={() => close()} />
				</>
			)}
		</Popup>
	);
};
