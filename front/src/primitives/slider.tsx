import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
	BackHandler,
	type GestureResponderEvent,
	Platform,
	View,
	type ViewInstance,
	type ViewProps,
} from "react-native";
import { cn } from "~/utils";
import { FocusGroup, type TVEvent, useTVEventHandler } from "./focus";

export const Slider = ({
	progress,
	subtleProgress,
	max = 100,
	step,
	seekOnFocus,
	markers,
	setProgress,
	startSeek,
	endSeek,
	cancelSeek,
	onHover,
	onMeasure,
	className,
	...props
}: {
	progress: number;
	max?: number;
	step?: number;
	// steps (-1 or 1) to seek by once the slider gets the focus, continuously if held
	seekOnFocus?: { direction: number; held: boolean };
	subtleProgress?: number;
	markers?: number[];
	setProgress: (progress: number) => void;
	startSeek?: () => void;
	endSeek?: () => void;
	cancelSeek?: () => void;
	onHover?: (
		position: number | null,
		layout: { x: number; y: number; width: number; height: number },
	) => void;
	// layout of the slider, relative to the page
	onMeasure?: (layout: {
		x: number;
		y: number;
		width: number;
		height: number;
	}) => void;
} & Partial<ViewProps>) => {
	const ref = useRef<ViewInstance>(null);
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
	// endSeek must be read when the timeout fires, it closes over the seek value
	const end = useEffectEvent(() => {
		commit.current = null;
		setSeek(false);
		endSeek?.();
	});
	const move = useEffectEvent((offset: number) => {
		if (!isSeeking) {
			setSeek(true);
			startSeek?.();
		}
		setProgress(Math.max(0, Math.min(progress + offset, max)));
		if (commit.current) clearTimeout(commit.current);
		commit.current = setTimeout(end, Platform.isTV ? 1500 : 500);
	});

	const s = step ?? 0.05 * max;
	// direction of the arrow being held (-1 or 1), 0 when none is
	const [held, setHeld] = useState(0);
	useEffect(() => {
		if (!held) return;
		const start = Date.now();
		move(held * s);
		// speed up the longer the key is held: x2 every second, up to x16
		const interval = setInterval(() => {
			const elapsed = Date.now() - start;
			move(held * s * Math.min(2 ** Math.floor(elapsed / 1000), 16));
		}, 100);
		return () => clearInterval(interval);
	}, [held, s]);

	// back drops the pending seek instead of leaving the page
	const cancel = useEffectEvent(() => {
		console.log("cancel");
		if (commit.current) clearTimeout(commit.current);
		commit.current = null;
		setHeld(0);
		setSeek(false);
		cancelSeek?.();
		return true;
	});
	useEffect(() => {
		// registered once the seek starts so it runs before the page's own back handlers
		if (!Platform.isTV || !isSeeking) return;
		const sub = BackHandler.addEventListener("hardwareBackPress", () =>
			cancel(),
		);
		return () => sub.remove();
	}, [isSeeking]);

	const pendingSeek = useRef(seekOnFocus && { ...seekOnFocus });
	useEffect(() => {
		const arrow = pendingSeek.current;
		if (!isFocus || !arrow) return;
		pendingSeek.current = undefined;
		if (arrow.held) setHeld(arrow.direction);
		else move(arrow.direction * s);
	}, [isFocus, s]);

	useTVEventHandler(
		useEffectEvent((event: TVEvent) => {
			// the hold may end before the slider got the focus
			if (
				pendingSeek.current &&
				event.eventKeyAction !== 0 &&
				(event.eventType === "longLeft" || event.eventType === "longRight")
			)
				pendingSeek.current.held = false;
			if (!isFocus) return;
			switch (event.eventType) {
				case "left":
				case "right":
					if (event.eventKeyAction !== 0)
						move(event.eventType === "left" ? -s : s);
					break;
				case "longLeft":
				case "longRight":
					if (event.eventKeyAction !== 0) setHeld(0);
					else setHeld(event.eventType === "longLeft" ? -1 : 1);
					break;
			}
		}),
	);

	return (
		// left/right seek, they must not also move the focus out of the slider
		<FocusGroup autoFocus trapFocusLeft trapFocusRight>
			<View
				ref={ref}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => {
					setHover(false);
					onHover?.(null, layout);
				}}
				// @ts-expect-error Web only
				onMouseMove={(e) =>
					onHover?.(
						Math.max(
							0,
							Math.min((e.clientX - layout.x) / layout.width, 1) * max,
						),
						layout,
					)
				}
				tabIndex={0}
				focusable
				collapsable={false}
				onFocus={() => setFocus(true)}
				onBlur={() => {
					setFocus(false);
					setHeld(0);
				}}
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
					ref.current?.measure((_, __, width, height, pageX, pageY) => {
						const layout = { width, height, x: pageX, y: pageY };
						setLayout(layout);
						onMeasure?.(layout);
					})
				}
				onKeyDown={(e) => {
					const { code, repeat } = e.nativeEvent;
					const direction =
						code === "ArrowLeft" ? -1 : code === "ArrowRight" ? 1 : 0;
					if (!direction) return;
					if (repeat) setHeld(direction);
					else move(direction * s);
				}}
				onKeyUp={(e) => {
					const { code } = e.nativeEvent;
					if (code !== "ArrowLeft" && code !== "ArrowRight") return;
					// the player's shortcuts would also seek on arrows
					e.stopPropagation();
					setHeld(0);
				}}
				className={cn(
					"cursor-pointer justify-center py-2 outline-0",
					className,
				)}
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
		</FocusGroup>
	);
};
