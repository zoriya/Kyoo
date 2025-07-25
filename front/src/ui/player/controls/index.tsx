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

export const HoverTouch = ({ children, ...props }: { children: ReactNode }) => {
	const hover = useAtomValue(hoverAtom);
	const setHover = useSetAtom(hoverReasonAtom);
	const mouseCallback = useRef<NodeJS.Timeout | null>(null);
	const touch = useRef<{ count: number; timeout?: NodeJS.Timeout }>({
		count: 0,
	});
	const playerWidth = useRef<number | null>(null);
	const isTouch = useIsTouch();

	const show = useCallback(() => {
		setHover((x) => ({ ...x, mouseMoved: true }));
		if (mouseCallback.current) clearTimeout(mouseCallback.current);
		mouseCallback.current = setTimeout(() => {
			setHover((x) => ({ ...x, mouseMoved: false }));
		}, 2500);
	}, [setHover]);

	// On mouse move
	useEffect(() => {
		if (Platform.OS !== "web") return;
		const handler = (e: PointerEvent) => {
			if (e.pointerType !== "mouse") return;
			show();
		};

		document.addEventListener("pointermove", handler);
		return () => document.removeEventListener("pointermove", handler);
	}, [show]);

	// When the controls hide, remove focus so space can be used to play/pause instead of triggering the button
	// It also serves to hide the tooltip.
	useEffect(() => {
		if (Platform.OS !== "web") return;
		if (!hover && document.activeElement instanceof HTMLElement)
			document.activeElement.blur();
	}, [hover]);

	const { css } = useYoshiki();

	const duration = useAtomValue(durationAtom);
	const setPlay = useSetAtom(playAtom);
	const setProgress = useSetAtom(progressAtom);
	const setFullscreen = useSetAtom(fullscreenAtom);

	const onPress = (e: { pointerType: string; x: number }) => {
		if (Platform.OS === "web" && e.pointerType === "mouse") {
			setPlay((x) => !x);
			return;
		}
		if (hover) setHover((x) => ({ ...x, mouseMoved: false }));
		else show();
	};
	const onDoublePress = (e: { pointerType: string; x: number }) => {
		if (Platform.OS === "web" && e.pointerType === "mouse") {
			// Only reset touch count for the web, on mobile you can continue to seek by pressing again.
			touch.current.count = 0;
			setFullscreen((x) => !x);
			return;
		}

		show();
		if (!duration || !playerWidth.current) return;

		if (e.x < playerWidth.current * 0.33) {
			setProgress((x) => Math.max(x - 10, 0));
		}
		if (e.x > playerWidth.current * 0.66) {
			setProgress((x) => Math.min(x + 10, duration));
		}
	};

	const onAnyPress = (e: { pointerType: string; x: number }) => {
		touch.current.count++;
		if (touch.current.count >= 2) {
			onDoublePress(e);
			clearTimeout(touch.current.timeout);
		} else {
			onPress(e);
		}

		touch.current.timeout = setTimeout(() => {
			touch.current.count = 0;
			touch.current.timeout = undefined;
		}, 400);
	};

	return (
		<Pressable
			tabIndex={-1}
			onPointerLeave={(e) => {
				if (e.nativeEvent.pointerType === "mouse")
					setHover((x) => ({ ...x, mouseMoved: false }));
			}}
			onPress={(e) => {
				e.preventDefault();
				onAnyPress({
					pointerType: isTouch ? "touch" : "mouse",
					x: e.nativeEvent.locationX ?? e.nativeEvent.pageX,
				});
			}}
			onLayout={(e) => {
				playerWidth.current = e.nativeEvent.layout.width;
			}}
			{...css(
				// @ts-expect-error Web only property (cursor: unset)
				{
					flexDirection: "row",
					justifyContent: "center",
					alignItems: "center",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					cursor: hover ? "unset" : "none",
				},
				props,
			)}
		>
			{children}
		</Pressable>
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
