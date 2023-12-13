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
	alpha,
	CircularProgress,
	ContrastArea,
	H1,
	H2,
	IconButton,
	Link,
	Poster,
	PressableFeedback,
	Skeleton,
	Slider,
	tooltip,
	touchOnly,
	ts,
} from "@kyoo/primitives";
import { Chapter, KyooImage, Subtitle, Audio } from "@kyoo/models";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import { ImageStyle, Platform, Pressable, View, ViewProps } from "react-native";
import { useTranslation } from "react-i18next";
import { percent, rem, useYoshiki } from "yoshiki/native";
import { useRouter } from "solito/router";
import ArrowBack from "@material-symbols/svg-400/rounded/arrow_back-fill.svg";
import { LeftButtons, TouchControls } from "./left-buttons";
import { RightButtons } from "./right-buttons";
import { bufferedAtom, durationAtom, loadAtom, playAtom, progressAtom } from "../state";

export const Hover = ({
	isLoading,
	name,
	showName,
	href,
	poster,
	chapters,
	subtitles,
	audios,
	fonts,
	previousSlug,
	nextSlug,
	onMenuOpen,
	onMenuClose,
	show,
	onPointerDown,
	...props
}: {
	isLoading: boolean;
	name?: string | null;
	showName?: string;
	href?: string;
	poster?: KyooImage | null;
	chapters?: Chapter[];
	subtitles?: Subtitle[];
	audios?: Audio[];
	fonts?: string[];
	previousSlug?: string | null;
	nextSlug?: string | null;
	onMenuOpen: () => void;
	onMenuClose: () => void;
	show: boolean;
} & ViewProps) => {
	// TODO: animate show
	const opacity = !show && (Platform.OS === "web" ? { opacity: 0 } : { display: "none" as const });
	return (
		<ContrastArea mode="dark">
			{({ css }) => (
				<>
					<Back isLoading={isLoading} name={showName} href={href} {...css(opacity, props)} />
					<TouchControls previousSlug={previousSlug} nextSlug={nextSlug} />
					<Pressable
						tabIndex={-1}
						onPointerDown={onPointerDown}
						onPress={Platform.OS !== "web" ? () => onPointerDown?.({} as any) : undefined}
						{...css(
							[
								{
									// Fixed is used because firefox android make the hover disapear under the navigation bar in absolute
									position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
									bottom: 0,
									left: 0,
									right: 0,
									bg: (theme) => theme.darkOverlay,
									flexDirection: "row",
									padding: percent(1),
								},
								opacity,
							],
							props,
						)}
					>
						<VideoPoster poster={poster} alt={showName} isLoading={isLoading} />
						<View
							{...css({
								marginLeft: { xs: ts(0.5), sm: ts(3) },
								flexDirection: "column",
								flexGrow: 1,
								flexShrink: 1,
								maxWidth: percent(100),
							})}
						>
							<H2 {...css({ paddingBottom: ts(1) })}>
								{isLoading ? <Skeleton {...css({ width: rem(15), height: rem(2) })} /> : name}
							</H2>
							<ProgressBar chapters={chapters} />
							<View
								{...css({
									flexDirection: "row",
									flexGrow: 1,
									justifyContent: "space-between",
									flexWrap: "wrap",
								})}
							>
								<LeftButtons previousSlug={previousSlug} nextSlug={nextSlug} />
								<RightButtons
									subtitles={subtitles}
									audios={audios}
									fonts={fonts}
									onMenuOpen={onMenuOpen}
									onMenuClose={onMenuClose}
								/>
							</View>
						</View>
					</Pressable>
				</>
			)}
		</ContrastArea>
	);
};

const ProgressBar = ({ chapters }: { chapters?: Chapter[] }) => {
	const [progress, setProgress] = useAtom(progressAtom);
	const buffered = useAtomValue(bufferedAtom);
	const duration = useAtomValue(durationAtom);
	const setPlay = useSetAtom(playAtom);

	return (
		<Slider
			progress={progress}
			startSeek={() => setPlay(false)}
			endSeek={() => setTimeout(() => setPlay(true), 10)}
			setProgress={setProgress}
			subtleProgress={buffered}
			max={duration}
			markers={chapters?.map((x) => x.startTime)}
		/>
	);
};

const Back = ({
	isLoading,
	name,
	href,
	...props
}: { isLoading: boolean; name?: string; href?: string } & ViewProps) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<View
			{...css(
				{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bg: (theme) => theme.darkOverlay,
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					padding: percent(0.33),
					color: "white",
				},
				props,
			)}
		>
			<IconButton
				icon={ArrowBack}
				{...(href
					? { as: Link as any, href: href }
					: { as: PressableFeedback, onPress: router.back })}
				{...tooltip(t("player.back"))}
			/>
			<Skeleton>
				{isLoading ? (
					<Skeleton {...css({ width: rem(5) })} />
				) : (
					<H1
						{...css({
							alignSelf: "center",
							fontSize: rem(1.5),
							marginLeft: rem(1),
						})}
					>
						{name}
					</H1>
				)}
			</Skeleton>
		</View>
	);
};

const VideoPoster = ({
	poster,
	alt,
	isLoading,
}: {
	poster?: KyooImage | null;
	alt?: string;
	isLoading: boolean;
}) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				width: "15%",
				display: { xs: "none", sm: "flex" },
				position: "relative",
			})}
		>
			<Poster
				src={poster}
				quality="low"
				alt={alt}
				forcedLoading={isLoading}
				layout={{ width: percent(100) }}
				{...(css({ position: "absolute", bottom: 0 }) as { style: ImageStyle })}
			/>
		</View>
	);
};

export const LoadingIndicator = () => {
	const isLoading = useAtomValue(loadAtom);
	const { css } = useYoshiki();

	if (!isLoading) return null;

	return (
		<View
			{...css({
				position: "absolute",
				pointerEvents: "none",
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				bg: (theme) => alpha(theme.colors.black, 0.3),
				justifyContent: "center",
			})}
		>
			<CircularProgress {...css({ alignSelf: "center" })} />
		</View>
	);
};
