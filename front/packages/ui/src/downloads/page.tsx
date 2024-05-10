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

import { type State, downloadAtom } from "./state";
import { FlashList } from "@shopify/flash-list";
import { type ImageStyle, View } from "react-native";
import {
	Alert,
	H6,
	IconButton,
	ImageBackground,
	Menu,
	P,
	PressableFeedback,
	SubP,
	focusReset,
	ts,
	usePageStyle,
} from "@kyoo/primitives";
import { EpisodeLine, displayRuntime, episodeDisplayNumber } from "../details/episode";
import { useTranslation } from "react-i18next";
import { EmptyView } from "../fetch";
import { percent, useYoshiki } from "yoshiki/native";
import type { KyooImage } from "@kyoo/models";
import { type Atom, useAtomValue } from "jotai";
import DownloadForOffline from "@material-symbols/svg-400/rounded/download_for_offline.svg";
import Downloading from "@material-symbols/svg-400/rounded/downloading.svg";
import ErrorIcon from "@material-symbols/svg-400/rounded/error.svg";
import NotStarted from "@material-symbols/svg-400/rounded/not_started.svg";
import { useRouter } from "expo-router";

const DownloadedItem = ({
	name,
	statusAtom,
	runtime,
	kind,
	image,
	...props
}: {
	name: string;
	statusAtom: Atom<State>;
	runtime: number | null;
	kind: "episode" | "movie";
	image: KyooImage | null;
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();
	const { error, status, progress, pause, resume, remove, play, retry } = useAtomValue(statusAtom);

	return (
		<PressableFeedback
			onPress={() => play?.(router)}
			{...css(
				{
					alignItems: "center",
					flexDirection: "row",
					fover: {
						self: focusReset,
						title: {
							textDecorationLine: "underline",
						},
					},
				},
				props,
			)}
		>
			<ImageBackground
				src={image}
				quality="low"
				alt=""
				gradient={false}
				hideLoad={false}
				layout={{
					width: percent(25),
					aspectRatio: kind === "episode" ? 16 / 9 : 2 / 3,
				}}
				{...(css({ flexShrink: 0, m: ts(1) }) as { style: ImageStyle })}
			>
				{/* {(watchedPercent || watchedStatus === WatchStatusV.Completed) && ( */}
				{/* 	<> */}
				{/* 		<View */}
				{/* 			{...css({ */}
				{/* 				backgroundColor: (theme) => theme.overlay0, */}
				{/* 				width: percent(100), */}
				{/* 				height: ts(0.5), */}
				{/* 				position: "absolute", */}
				{/* 				bottom: 0, */}
				{/* 			})} */}
				{/* 		/> */}
				{/* 		<View */}
				{/* 			{...css({ */}
				{/* 				backgroundColor: (theme) => theme.accent, */}
				{/* 				width: percent(watchedPercent ?? 100), */}
				{/* 				height: ts(0.5), */}
				{/* 				position: "absolute", */}
				{/* 				bottom: 0, */}
				{/* 			})} */}
				{/* 		/> */}
				{/* 	</> */}
				{/* )} */}
			</ImageBackground>
			<View
				{...css({
					flexGrow: 1,
					flexShrink: 1,
					flexDirection: "row",
					justifyContent: "space-between",
				})}
			>
				<View {...css({ flexGrow: 1, flexShrink: 1 })}>
					{/* biome-ignore lint/a11y/useValidAriaValues: use h6 for style only */}
					<H6 aria-level={undefined} {...css([{ flexShrink: 1 }, "title"])}>
						{name ?? t("show.episodeNoMetadata")}
					</H6>
					{status === "FAILED" && <P>{t("downloads.error", { error: error ?? "Unknow error" })}</P>}
					{runtime && status === "DONE" && <SubP>{displayRuntime(runtime)}</SubP>}
					{progress !== 100 && progress !== null && (
						<View {...css({ flexDirection: "row", alignItems: "center" })}>
							<SubP {...css({ flexShrink: 0 })}>{Math.round(progress)}%</SubP>
							<View
								{...css({
									flexGrow: 1,
									flexShrink: 1,
									marginLeft: ts(0.5),
									height: ts(0.5),
									backgroundColor: (theme) => theme.user.overlay0,
								})}
							>
								<View
									{...css({
										backgroundColor: (theme) => theme.user.accent,
										width: percent(progress),
										height: percent(100),
									})}
								/>
							</View>
						</View>
					)}
				</View>
				<Menu Trigger={IconButton} icon={downloadIcon(status)}>
					{status === "FAILED" && (
						<Menu.Item label={t("downloads.retry")} onSelect={() => retry?.()} />
					)}
					{status === "DOWNLOADING" && (
						<Menu.Item label={t("downloads.pause")} onSelect={() => pause?.()} />
					)}
					{status === "PAUSED" && (
						<Menu.Item label={t("downloads.resume")} onSelect={() => resume?.()} />
					)}
					<Menu.Item
						label={t("downloads.delete")}
						onSelect={() => {
							Alert.alert(
								t("downloads.delete"),
								t("downloads.deleteMessage"),
								[
									{ text: t("misc.cancel"), style: "cancel" },
									{ text: t("misc.delete"), onPress: remove, style: "destructive" },
								],
								{
									icon: "error",
								},
							);
						}}
					/>
				</Menu>
			</View>
		</PressableFeedback>
	);
};

const downloadIcon = (status: State["status"]) => {
	switch (status) {
		case "DONE":
			return DownloadForOffline;
		case "DOWNLOADING":
			return Downloading;
		case "FAILED":
			return ErrorIcon;
		case "PAUSED":
		case "STOPPED":
			return NotStarted;
	}
};

export const DownloadPage = () => {
	const pageStyle = usePageStyle();
	const downloads = useAtomValue(downloadAtom);
	const { t } = useTranslation();

	if (downloads.length === 0) return <EmptyView message={t("downloads.empty")} />;

	return (
		<FlashList
			data={downloads}
			getItemType={(item) => item.data.kind}
			renderItem={({ item }) => (
				<DownloadedItem
					name={
						item.data.kind === "episode"
							? `${episodeDisplayNumber(item.data)!}: ${item.data.name}`
							: item.data.name
					}
					statusAtom={item.state}
					runtime={item.data.runtime}
					kind={item.data.kind}
					image={item.data.kind === "episode" ? item.data.thumbnail : item.data.poster}
				/>
			)}
			estimatedItemSize={EpisodeLine.layout.size}
			keyExtractor={(x) => x.data.id}
			numColumns={1}
			contentContainerStyle={pageStyle}
		/>
	);
};
