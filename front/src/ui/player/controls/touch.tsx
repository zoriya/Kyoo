import { useCallback, useEffect, useRef, useState } from "react";
import {
	type GestureResponderEvent,
	Platform,
	Pressable,
	type PressableProps,
	View,
	type ViewProps,
} from "react-native";
import { useEvent, type VideoPlayer } from "react-native-video";
import { useIsTouch } from "~/primitives";
import { cn } from "~/utils";
import { toggleFullscreen } from "./misc";

export const TouchControls = ({
	player,
	children,
	forceShow = false,
	...props
}: {
	player: VideoPlayer;
	forceShow?: boolean;
} & ViewProps) => {
	const isTouch = useIsTouch();

	const [playing, setPlay] = useState(player.isPlaying);
	useEvent(player, "onPlaybackStateChange", (status) => {
		setPlay(status.isPlaying);
	});

	const [_show, setShow] = useState(false);
	const hideTimeout = useRef<NodeJS.Timeout | number | null>(null);
	const shouldShow = forceShow || _show || !playing;
	const show = useCallback((val: boolean = true) => {
		setShow(val);
		if (hideTimeout.current) clearTimeout(hideTimeout.current);
		hideTimeout.current = setTimeout(() => {
			hideTimeout.current = null;
			setShow(false);
		}, 2500);
	}, []);

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

	return (
		<View {...props}>
			<DoublePressable
				tabIndex={-1}
				onPress={() => {
					if (isTouch) {
						show(!shouldShow);
						return;
					}
					if (player.isPlaying) player.pause();
					else player.play();
				}}
				onDoublePress={(e) => {
					if (!isTouch) {
						toggleFullscreen();
						return;
					}

					show();
					if (Number.isNaN(player.duration) || !playerWidth.current) return;

					const x = e.nativeEvent.locationX ?? e.nativeEvent.pageX;
					if (x < playerWidth.current * 0.33) player.seekBy(-10);
					if (x > playerWidth.current * 0.66) player.seekBy(10);
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
				className={cn("absolute inset-0 cursor-default", !shouldShow && "cursor-none")}
			/>
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
