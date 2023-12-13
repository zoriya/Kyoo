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
	ts,
} from "@kyoo/primitives";
import { Chapter, KyooImage, Subtitle, Audio } from "@kyoo/models";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import {
	ImageStyle,
	Platform,
	Pressable,
	View,
	ViewProps,
	PointerEvent as NativePointerEvent,
	GestureResponderEvent,
} from "react-native";
import { useTranslation } from "react-i18next";
import { percent, rem, useYoshiki } from "yoshiki/native";
import { useRouter } from "solito/router";
import ArrowBack from "@material-symbols/svg-400/rounded/arrow_back-fill.svg";
import { LeftButtons, TouchControls } from "./left-buttons";
import { RightButtons } from "./right-buttons";
import {
	bufferedAtom,
	durationAtom,
	fullscreenAtom,
	loadAtom,
	playAtom,
	progressAtom,
} from "../state";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import { atom } from "jotai";

const hoverReasonAtom = atom({
	mouseMoved: false,
	mouseHover: false,
	menuOpened: false,
});
export const hoverAtom = atom((get) =>
	[!get(playAtom), ...Object.values(get(hoverReasonAtom))].includes(true),
);

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
}) => {
	const show = useAtomValue(hoverAtom);
	const setHover = useSetAtom(hoverReasonAtom);

	return (
		<ContrastArea mode="dark">
			{({ css }) => (
				<>
					<TouchControls previousSlug={previousSlug} nextSlug={nextSlug} />
					<View
						onPointerEnter={(e) => {
							if (e.nativeEvent.pointerType === "mouse")
								setHover((x) => ({ ...x, mouseHover: true }));
						}}
						onPointerLeave={(e) => {
							if (e.nativeEvent.pointerType === "mouse")
								setHover((x) => ({ ...x, mouseHover: false }));
						}}
						{...css({
							// TODO: animate show
							display: !show ? "none" : "flex",
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
							isLoading={isLoading}
							name={showName}
							href={href}
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
								<H2 numberOfLines={1} {...css({ paddingBottom: ts(1) })}>
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
										onMenuOpen={() => setHover((x) => ({ ...x, menuOpened: true }))}
										onMenuClose={() => {
											// Disable hover since the menu overlay makes the mouseout unreliable.
											setHover((x) => ({ ...x, menuOpened: false, mouseHover: false }));
										}}
									/>
								</View>
							</View>
						</View>
					</View>
				</>
			)}
		</ContrastArea>
	);
};

export const HoverTouch = ({ children, ...props }: { children: ReactNode }) => {
	const hover = useAtomValue(hoverAtom);
	const setHover = useSetAtom(hoverReasonAtom);
	const mouseCallback = useRef<NodeJS.Timeout | null>(null);
	const touch = useRef<{ count: number; timeout?: NodeJS.Timeout }>({ count: 0 });
	const playerWidth = useRef<number | null>(null);

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
		if (!hover && document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
				if (e.nativeEvent.pointerType === "mouse") setHover((x) => ({ ...x, mouseMoved: false }));
			}}
			onPointerDown={(e) => {
				// Theorically, this is available everywhere but android never calls this pointerDown so
				// touch are handled in the onPress and we early return here if it is every called to prevent
				// the click action to run twice.
				if (Platform.OS !== "web") return;
				e.preventDefault();
				onAnyPress(e.nativeEvent);
			}}
			onPress={(e) => {
				if (Platform.OS === "web") return;
				e.preventDefault();
				onAnyPress({ pointerType: "touch", x: e.nativeEvent.locationX });
			}}
			onLayout={(e) => {
				playerWidth.current = e.nativeEvent.layout.width;
			}}
			{...css(
				{
					flexDirection: "row",
					justifyContent: "center",
					alignItems: "center",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					// @ts-expect-error Web only property
					cursor: hover ? "unset" : "none",
				},
				props,
			)}
		>
			{children}
		</Pressable>
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

export const Back = ({
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
