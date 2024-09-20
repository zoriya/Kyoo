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

import "react-native-video";
import type { ReactVideoSourceProperties } from "react-native-video";

declare module "react-native-video" {
	interface ReactVideoProps {
		fonts?: string[];
		subtitles?: Subtitle[];
		onMediaUnsupported?: () => void;
	}
	export type VideoProps = Omit<ReactVideoProps, "source"> & {
		source: ReactVideoSourceProperties & { hls: string | null };
	};
}

export * from "react-native-video";

import { type Audio, type Subtitle, useToken } from "@kyoo/models";
import { type IconButton, Menu } from "@kyoo/primitives";
import "@kyoo/primitives/src/types.d.ts";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { type ComponentProps, forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import uuid from "react-native-uuid";
import NativeVideo, {
	type VideoRef,
	type OnLoadData,
	type VideoProps,
	SelectedTrackType,
	SelectedVideoTrackType,
} from "react-native-video";
import { useYoshiki } from "yoshiki/native";
import { useDisplayName } from "../utils";
import { PlayMode, audioAtom, playModeAtom, subtitleAtom } from "./state";

const MimeTypes: Map<string, string> = new Map([
	["subrip", "application/x-subrip"],
	["ass", "text/x-ssa"],
	["vtt", "text/vtt"],
]);

const infoAtom = atom<OnLoadData | null>(null);
const videoAtom = atom(0);

const clientId = uuid.v4() as string;

const Video = forwardRef<VideoRef, VideoProps>(function Video(
	{ onLoad, onBuffer, onError, onMediaUnsupported, source, subtitles, ...props },
	ref,
) {
	const { css } = useYoshiki();
	const token = useToken();
	const setInfo = useSetAtom(infoAtom);
	const [video, setVideo] = useAtom(videoAtom);
	const audio = useAtomValue(audioAtom);
	const subtitle = useAtomValue(subtitleAtom);
	const mode = useAtomValue(playModeAtom);

	useEffect(() => {
		if (mode === PlayMode.Hls) setVideo(-1);
	}, [mode, setVideo]);

	return (
		<View {...css({ flexGrow: 1, flexShrink: 1 })}>
			<NativeVideo
				ref={ref}
				source={{
					...source,
					headers: {
						...(token ? { Authorization: token } : {}),
						"X-CLIENT-ID": clientId,
					},
				}}
				onLoad={(info) => {
					onBuffer?.({ isBuffering: false });
					setInfo(info);
					onLoad?.(info);
				}}
				onBuffer={onBuffer}
				onError={(error) => {
					console.error(error);
					if (mode === PlayMode.Direct) onMediaUnsupported?.();
					else onError?.(error);
				}}
				selectedVideoTrack={
					video === -1
						? { type: SelectedVideoTrackType.AUTO }
						: { type: SelectedVideoTrackType.RESOLUTION, value: video }
				}
				// when video file is invalid, audio is undefined
				selectedAudioTrack={{ type: SelectedTrackType.INDEX, value: audio?.index ?? 0 }}
				textTracks={subtitles?.map((x) => ({
					type: MimeTypes.get(x.codec) as any,
					uri: x.link!,
					title: x.title ?? "Unknown",
					language: x.language ?? ("Unknown" as any),
				}))}
				selectedTextTrack={
					subtitle
						? {
								type: SelectedTrackType.INDEX,
								value: subtitles?.indexOf(subtitle),
							}
						: { type: SelectedTrackType.DISABLED, value: "" }
				}
				{...props}
			/>
		</View>
	);
});

export default Video;

// mobile should be able to play everything
export const canPlay = (_codec: string) => true;

type CustomMenu = ComponentProps<typeof Menu<ComponentProps<typeof IconButton>>>;
export const AudiosMenu = ({ audios, ...props }: CustomMenu & { audios?: Audio[] }) => {
	const info = useAtomValue(infoAtom);
	const [audio, setAudio] = useAtom(audioAtom);
	const getDisplayName = useDisplayName();

	if (!info || info.audioTracks.length < 2) return null;

	return (
		<Menu {...props}>
			{info.audioTracks.map((x) => (
				<Menu.Item
					key={x.index}
					label={audios ? getDisplayName(audios[x.index]) : (x.title ?? x.language ?? "Unknown")}
					selected={audio!.index === x.index}
					onSelect={() => setAudio(x as any)}
				/>
			))}
		</Menu>
	);
};

export const QualitiesMenu = (props: CustomMenu) => {
	const { t } = useTranslation();
	const info = useAtomValue(infoAtom);
	const [mode, setPlayMode] = useAtom(playModeAtom);
	const [video, setVideo] = useAtom(videoAtom);

	return (
		<Menu {...props}>
			<Menu.Item
				label={t("player.direct")}
				selected={mode === PlayMode.Direct}
				onSelect={() => setPlayMode(PlayMode.Direct)}
			/>
			<Menu.Item
				// TODO: Display the currently selected quality (impossible with rn-video right now)
				label={t("player.auto")}
				selected={video === -1 && mode === PlayMode.Hls}
				onSelect={() => {
					setPlayMode(PlayMode.Hls);
					setVideo(-1);
				}}
			/>
			{/* TODO: Support video tracks when the play mode is not hls. */}
			{info?.videoTracks
				.sort((a: any, b: any) => b.height - a.height)
				.map((x: any, i: number) => (
					<Menu.Item
						key={i}
						label={`${x.height}p`}
						selected={video === x.height}
						onSelect={() => {
							setPlayMode(PlayMode.Hls);
							setVideo(x.height);
						}}
					/>
				))}
		</Menu>
	);
};
