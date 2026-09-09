import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
	type GestureResponderEvent,
	type HWEvent,
	Platform,
	View,
	type ViewProps,
} from "react-native";
import { cn } from "~/utils";
import { useTVEventHandler } from "./focus";

export const Slider = ({
	progress,
	subtleProgress,
	max = 100,
	markers,
	setProgress,
	startSeek,
	endSeek,
	onHover,
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
} & Partial<ViewProps>) => {
	const ref = useRef<View>(null);
	const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const [isSeeking, setSeek] = useState(false);
	const [isHover, setHover] = useState(false);
	const [isFocus, setFocus] = useState(false);
	const smallBar = !(isSeeking || isHover || isFocus);

	const change = (event: GestureResponderEvent) => {
		event.preventDefault();
		const locationX = Platform.select({
			android: event.nativeEvent.pageX - layout.x,
			default: event.nativeEvent.locationX,
		});
		setProgress(Math.max(0, Math.min(locationX / layout.width, 1)) * max);
	};

	const commit = useRef<NodeJS.Timeout | number | null>(null);
	useEffect(() => {
		return () => {
			if (commit.current) clearTimeout(commit.current);
		};
	}, []);
	useTVEventHandler(
		useEffectEvent((event: HWEvent) => {
			if (!isFocus || event.eventKeyAction === 0) return;
			const step =
				event.eventType === "left"
					? -0.05 * max
					: event.eventType === "right"
						? 0.05 * max
						: 0;
			if (!step) return;

			if (!isSeeking) {
				setSeek(true);
				startSeek?.();
			}
			setProgress(Math.max(0, Math.min(progress + step, max)));
			if (commit.current) clearTimeout(commit.current);
			commit.current = setTimeout(() => {
				commit.current = null;
				setSeek(false);
				endSeek?.();
			}, 500);
		}),
	);

	return (
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
			focusable
			collapsable={false}
			onFocus={() => setFocus(true)}
			onBlur={() => setFocus(false)}
			onStartShouldSetResponder={() => true}
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
				ref.current?.measure((_, __, width, height, pageX, pageY) =>
					setLayout({ width, height, x: pageX, y: pageY }),
				)
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
};
