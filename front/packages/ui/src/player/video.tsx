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

declare module "react-native-video" {
	interface ReactVideoProps {
		fonts?: string[];
		subtitles?: Subtitle[];
		onPlayPause: (isPlaying: boolean) => void;
		onMediaUnsupported?: () => void;
	}
	export type VideoProps = Omit<ReactVideoProps, "source"> & {
		source: { uri: string; hls: string | null; startPosition?: number };
	};
}

export * from "react-native-video";

import { Audio, Subtitle, getToken } from "@kyoo/models";
import { IconButton, Menu } from "@kyoo/primitives";
import { ComponentProps, forwardRef, useEffect, useRef } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import NativeVideo, {
	VideoRef,
	OnLoadData,
	VideoProps,
	SelectedTrackType,
	SelectedVideoTrackType,
} from "react-native-video";
import { useTranslation } from "react-i18next";
import { PlayMode, audioAtom, playModeAtom, subtitleAtom } from "./state";
import uuid from "react-native-uuid";
import { View } from "react-native";
import "@kyoo/primitives/src/types.d.ts";
import { useYoshiki } from "yoshiki/native";

const MimeTypes: Map<string, string> = new Map([
	["subrip", "application/x-subrip"],
	["ass", "text/x-ssa"],
	["vtt", "text/vtt"],
]);

const infoAtom = atom<OnLoadData | null>(null);
const videoAtom = atom(0);

const clientId = uuid.v4() as string;

const Video = forwardRef<VideoRef, VideoProps>(function Video(
	{ onLoad, onBuffer, source, onPointerDown, subtitles, ...props },
	ref,
) {
	const { css } = useYoshiki();
	const token = useRef<string | null>(null);
	const setInfo = useSetAtom(infoAtom);
	const video = useAtomValue(videoAtom);
	const audio = useAtomValue(audioAtom);
	const subtitle = useAtomValue(subtitleAtom);

	useEffect(() => {
		async function run() {
			token.current = await getToken();
		}
		run();
	}, [source]);

	return (
		<View {...css({ flexGrow: 1, flexShrink: 1 })}>
			<NativeVideo
				ref={ref}
				source={{
					...source,
					headers: {
						Authorization: `Bearer: ${token.current}`,
						"X-CLIENT-ID": clientId,
					},
				}}
				onLoad={(info) => {
					onBuffer?.({ isBuffering: false });
					setInfo(info);
					onLoad?.(info);
				}}
				onBuffer={onBuffer}
				selectedVideoTrack={
					video === -1
						? { type: SelectedVideoTrackType.AUDO }
						: { type: SelectedVideoTrackType.RESOLUTION, value: video }
				}
				selectedAudioTrack={{ type: SelectedTrackType.INDEX, value: audio.index }}
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
						: { type: SelectedTrackType.DISABLED }
				}
				{...props}
			/>
		</View>
	);
});

export default Video;

type CustomMenu = ComponentProps<typeof Menu<ComponentProps<typeof IconButton>>>;
export const AudiosMenu = ({ audios, ...props }: CustomMenu & { audios?: Audio[] }) => {
	const info = useAtomValue(infoAtom);
	const [audio, setAudio] = useAtom(audioAtom);

	if (!info || info.audioTracks.length < 2) return null;

	return (
		<Menu {...props}>
			{info.audioTracks.map((x) => (
				<Menu.Item
					key={x.index}
					label={audios?.[x.index].displayName ?? x.title ?? x.language ?? "Unknown"}
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
				selected={mode == PlayMode.Direct}
				onSelect={() => setPlayMode(PlayMode.Direct)}
			/>
			<Menu.Item
				// TODO: Display the currently selected quality (impossible with rn-video right now)
				label={t("player.auto")}
				selected={video === -1 && mode == PlayMode.Hls}
				onSelect={() => {
					setPlayMode(PlayMode.Hls);
					setVideo(-1);
				}}
			/>
			{/* TODO: Support video tracks when the play mode is not hls. */}
			{/* @ts-expect-error They forgot to type this. */}
			{info?.videoTracks.map((x) => (
				<Menu.Item
					key={x.height}
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
