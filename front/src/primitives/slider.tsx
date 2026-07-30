import { useMemo, useRef, useState } from "react";
import {
	type GestureResponderEvent,
	Platform,
	View,
	type ViewProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
	runOnJS,
	type SharedValue,
	useSharedValue,
} from "react-native-reanimated";
import { cn } from "~/utils";

export const Slider = ({
	progress,
	subtleProgress,
	max = 100,
	markers,
	setProgress,
	startSeek,
	endSeek,
	onHover,
	// When provided (native only), the drag runs on the UI thread and writes the
	// current position (as a 0..1 fraction) to this shared value, so consumers
	// like the bottom scrubber can follow the finger without a per-frame JS
	// re-render. The React `setProgress`/state path is still driven (via
	// `runOnJS`) for the label, the fill and the final seek commit.
	progressValue,
	className,
	...props
}: {
	progress: number;
	max?: number;
	subtleProgress?: number;
	markers?: number[];
	setProgress: (progress: number) => void;
	startSeek?: () => void;
	endSeek?: () => void;
	onHover?: (
		position: number | null,
		layout: { x: number; y: number; width: number; height: number },
	) => void;
	progressValue?: SharedValue<number>;
} & Partial<ViewProps>) => {
	const ref = useRef<View>(null);
	const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const [isSeeking, setSeek] = useState(false);
	const [isHover, setHover] = useState(false);
	const [isFocus, setFocus] = useState(false);
	const smallBar = !(isSeeking || isHover || isFocus);

	// Off-thread drag: only used on native and only when a caller opts in by
	// passing `progressValue`. Web and the volume slider keep the responder path.
	const useGesture = progressValue != null && Platform.OS !== "web";
	const trackWidth = useSharedValue(0);
	const pan = useMemo(
		() =>
			Gesture.Pan()
				.minDistance(0)
				.onBegin((e) => {
					const fraction = Math.max(0, Math.min(e.x / trackWidth.value, 1));
					if (progressValue) progressValue.value = fraction;
					runOnJS(setSeek)(true);
					if (startSeek) runOnJS(startSeek)();
					runOnJS(setProgress)(fraction * max);
				})
				.onUpdate((e) => {
					const fraction = Math.max(0, Math.min(e.x / trackWidth.value, 1));
					if (progressValue) progressValue.value = fraction;
					runOnJS(setProgress)(fraction * max);
				})
				.onFinalize(() => {
					runOnJS(setSeek)(false);
					if (endSeek) runOnJS(endSeek)();
				}),
		[max, progressValue, setProgress, startSeek, endSeek, trackWidth],
	);

	const change = (event: GestureResponderEvent) => {
		event.preventDefault();
		const locationX = Platform.select({
			android: event.nativeEvent.pageX - layout.x,
			default: event.nativeEvent.locationX,
		});
		setProgress(Math.max(0, Math.min(locationX / layout.width, 1)) * max);
	};

	const content = (
		<View
			ref={ref}
			// @ts-expect-error Web only
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => {
				setHover(false);
				onHover?.(null, layout);
			}}
			// @ts-expect-error Web only
			onMouseMove={(e) =>
				onHover?.(
					Math.max(0, Math.min((e.clientX - layout.x) / layout.width, 1) * max),
					layout,
				)
			}
			tabIndex={0}
			onFocus={() => setFocus(true)}
			onBlur={() => setFocus(false)}
			// On the native gesture path, decline the RN responder so it doesn't
			// fight the gesture-handler Pan for the same touch.
			onStartShouldSetResponder={() => !useGesture}
			onResponderGrant={() => {
				setSeek(true);
				startSeek?.call(null);
			}}
			onResponderRelease={() => {
				setSeek(false);
				endSeek?.call(null);
			}}
			onResponderStart={change}
			onResponderMove={change}
			onLayout={() =>
				ref.current?.measure((_, __, width, height, pageX, pageY) => {
					setLayout({ width, height, x: pageX, y: pageY });
					trackWidth.value = width;
				})
			}
			onKeyDown={(e: KeyboardEvent) => {
				switch (e.code) {
					case "ArrowLeft":
						setProgress(Math.max(progress - 0.05 * max, 0));
						break;
					case "ArrowRight":
						setProgress(Math.min(progress + 0.05 * max, max));
						break;
					case "ArrowDown":
						setProgress(Math.max(progress - 0.1 * max, 0));
						break;
					case "ArrowUp":
						setProgress(Math.min(progress + 0.1 * max, max));
						break;
				}
			}}
			className={cn("cursor-pointer justify-center py-2 outline-0", className)}
			{...props}
		>
			<View
				className={cn(
					"h-2 w-full overflow-hidden rounded bg-slate-400",
					smallBar && "scale-y-50",
				)}
			>
				{subtleProgress !== undefined && (
					<View
						className={cn("absolute left-0 h-full bg-slate-300")}
						style={{ width: `${(subtleProgress / max) * 100}%` }}
					/>
				)}
				<View
					className="absolute left-0 h-full bg-accent"
					style={{ width: `${(progress / max) * 100}%` }}
				/>
				{markers?.map((x) => (
					<View
						key={x}
						className="absolute h-full w-1 bg-accent"
						style={{ left: `${Math.min(100, (x / max) * 100)}%` }}
					/>
				))}
			</View>
			<View
				className={cn(
					"absolute my-1 ml-[-6px] h-3 w-3 rounded-full bg-accent",
					smallBar && "opacity-0",
				)}
				style={{ left: `${(progress / max) * 100}%` }}
			/>
		</View>
	);

	if (useGesture) return <GestureDetector gesture={pan}>{content}</GestureDetector>;
	return content;
};
