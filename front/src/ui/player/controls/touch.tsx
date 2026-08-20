import FastForward from "@material-symbols/svg-400/rounded/fast_forward-fill.svg";
import FastRewind from "@material-symbols/svg-400/rounded/fast_rewind-fill.svg";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type GestureResponderEvent,
	Platform,
	Pressable,
	type PressableProps,
	View,
	type ViewProps,
} from "react-native";
import { usePlayer, usePlayerState } from "react-native-omni";
import { Icon, isTouchDevice, P } from "~/primitives";
import { cn } from "~/utils";
import { toggleFullscreen } from "./misc";

export const TouchControls = ({
	children,
	forceShow = false,
	onVisibilityChange,
	...props
}: {
	forceShow?: boolean;
	onVisibilityChange?: (isVisible: boolean) => void;
} & ViewProps) => {
	const { t } = useTranslation();
	const player = usePlayer();
	const playing = usePlayerState("isPlaying");

	const [_show, setShow] = useState(false);
	const hideTimeout = useRef<NodeJS.Timeout | number | null>(null);
	const shouldShow = forceShow || _show || !playing;

	useEffect(() => {
		onVisibilityChange?.(shouldShow);
	}, [onVisibilityChange, shouldShow]);

	const show = useCallback((val: boolean = true) => {
		setShow(val);
		if (hideTimeout.current) clearTimeout(hideTimeout.current);
		hideTimeout.current = setTimeout(() => {
			hideTimeout.current = null;
			setShow(false);
		}, 2500);
	}, []);

	// whatever forced the controls open (a menu, a seek) is over: give back the usual
	// grace period instead of hiding right away.
	const wasForced = useRef(forceShow);
	useEffect(() => {
		if (wasForced.current && !forceShow) show();
		wasForced.current = forceShow;
	}, [forceShow, show]);

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

	const playerWidth = useRef<number | null>(null);

	const [seeked, setSeeked] = useState(0);
	const seekedTimeout = useRef<NodeJS.Timeout | number | null>(null);

	return (
		<View {...props}>
			<DoublePressable
				tabIndex={-1}
				onPress={() => {
					if (isTouchDevice()) {
						show(!shouldShow);
						return;
					}
					if (player.isPlaying) player.pause();
					else player.play();
				}}
				onDoublePress={(e) => {
					if (!isTouchDevice()) {
						toggleFullscreen();
						return;
					}

					show();
					if (Number.isNaN(player.duration) || !playerWidth.current) return;

					const x = e.nativeEvent.locationX ?? e.nativeEvent.pageX;
					const seek =
						x < playerWidth.current * 0.33
							? -10
							: x > playerWidth.current * 0.66
								? 10
								: 0;
					if (!seek) return true;

					player.seekBy(seek);
					setSeeked((old) => (old * seek > 0 ? old : 0) + seek);
					if (seekedTimeout.current) clearTimeout(seekedTimeout.current);
					seekedTimeout.current = setTimeout(() => {
						seekedTimeout.current = null;
						setSeeked(0);
					}, 800);
					// Do not reset press count, you can continue to seek by pressing again.
					return true;
				}}
				onLayout={(e) => {
					playerWidth.current = e.nativeEvent.layout.width;
				}}
				onPointerLeave={(e) => {
					// instantly hide the controls when mouse leaves the view
					if (e.nativeEvent.pointerType === "mouse") show(false);
				}}
				className={cn(
					"absolute inset-0 cursor-default!",
					!shouldShow && "cursor-none!",
				)}
			/>
			{seeked !== 0 && (
				<View
					className={cn(
						"pointer-events-none absolute inset-y-0 w-1/3 items-center justify-center",
						seeked < 0 ? "left-0" : "right-0",
					)}
				>
					<View className="items-center rounded-full bg-slate-900/40 p-4">
						<Icon
							icon={seeked < 0 ? FastRewind : FastForward}
							className="fill-slate-200 dark:fill-slate-200"
						/>
						<P className="text-slate-200 dark:text-slate-200">
							{t("player.seek", { seconds: Math.abs(seeked) })}
						</P>
					</View>
				</View>
			)}
			{shouldShow && children}
		</View>
	);
};

const DoublePressable = ({
	onPress,
	onDoublePress,
	...props
}: {
	onDoublePress: (e: GestureResponderEvent) => boolean | undefined;
} & PressableProps) => {
	const touch = useRef<{ count: number; timeout?: NodeJS.Timeout | number }>({
		count: 0,
	});

	return (
		<Pressable
			onPress={(e) => {
				e.preventDefault();
				touch.current.count++;
				if (touch.current.count >= 2) {
					const keepCount = onDoublePress(e);
					if (!keepCount) touch.current.count = 0;
					clearTimeout(touch.current.timeout);
				} else {
					onPress?.(e);
				}

				touch.current.timeout = setTimeout(() => {
					touch.current.count = 0;
					touch.current.timeout = undefined;
				}, 400);
			}}
			{...props}
		/>
	);
};
