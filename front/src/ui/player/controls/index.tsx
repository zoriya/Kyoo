import ArrowBack from "@material-symbols/svg-400/rounded/arrow_back-fill.svg";
import { useRouter } from "expo-router";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
	type ImageStyle,
	Platform,
	Pressable,
	View,
	type ViewProps,
} from "react-native";
import { useEvent, type VideoPlayer } from "react-native-video";
import { percent, rem, useYoshiki } from "yoshiki/native";
import type { AudioTrack, Chapter, KImage, Subtitle } from "~/models";
import {
	alpha,
	CircularProgress,
	H1,
	H2,
	IconButton,
	Poster,
	PressableFeedback,
	Skeleton,
	Slider,
	Tooltip,
	tooltip,
	ts,
	useIsTouch,
} from "~/primitives";
import { LeftButtons } from "./components/left-buttons";
import { RightButtons } from "./components/right-buttons";
import { BottomScrubber, ScrubberTooltip } from "./scrubber";

export const Controls = ({
	player,
	title,
}: {
	player: VideoPlayer;
	title: string;
	description: string | null;
	poster: KImage | null;
}) => {
	const { css } = useYoshiki();
	// const show = useAtomValue(hoverAtom);
	// const setHover = useSetAtom(hoverReasonAtom);
	// const isSeeking = useAtomValue(seekingAtom);
	// const isTouch = useIsTouch();

	// const showBottomSeeker = isSeeking && isTouch;

	// <TouchControls previousSlug={previousSlug} nextSlug={nextSlug} />
	return (
		<View
			// onPointerEnter={(e) => {
			// 	if (e.nativeEvent.pointerType === "mouse")
			// 		setHover((x) => ({ ...x, mouseHover: true }));
			// }}
			// onPointerLeave={(e) => {
			// 	if (e.nativeEvent.pointerType === "mouse")
			// 		setHover((x) => ({ ...x, mouseHover: false }));
			// }}
			{...css({
				// TODO: animate show
				//display: !show ? "none" : "flex",
				position: "absolute",
				top: 0,
				left: 0,
				bottom: 0,
				right: 0,
				// box-none does not work on the web while none does not work on android
				pointerEvents: Platform.OS === "web" ? "none" : "box-none",
			})}
		>
			<Back
				name={title}
				{...css({
					pointerEvents: "auto",
				})}
			/>
			<View
				{...css({
					// Fixed is used because firefox android make the hover disapear under the navigation bar in absolute
					position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					bg: (theme) => theme.darkOverlay,
					flexDirection: "row",
					pointerEvents: "auto",
					padding: percent(1),
				})}
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
					{!showBottomSeeker && (
						<H2 numberOfLines={1} {...css({ paddingBottom: ts(1) })}>
							{isLoading ? (
								<Skeleton {...css({ width: rem(15), height: rem(2) })} />
							) : (
								name
							)}
						</H2>
					)}
					<ProgressBar chapters={chapters} url={url} />
					{showBottomSeeker ? (
						<BottomScrubber url={url} chapters={chapters} />
					) : (
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
								onMenuOpen={() => setHover((x) => ({ ...x, menuOpened: true }))}
								onMenuClose={() => {
									// Disable hover since the menu overlay makes the mouseout unreliable.
									setHover((x) => ({
										...x,
										menuOpened: false,
										mouseHover: false,
									}));
								}}
							/>
						</View>
					)}
				</View>
			</View>
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
