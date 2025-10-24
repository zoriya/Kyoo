import { useRef, useState } from "react";
import {
	type GestureResponderEvent,
	Platform,
	View,
	type ViewProps,
} from "react-native";
import { percent, px, useYoshiki } from "yoshiki/native";
import { focusReset } from "./utils";

export const Slider = ({
	progress,
	subtleProgress,
	max = 100,
	markers,
	setProgress,
	startSeek,
	endSeek,
	onHover,
	size = 6,
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
	size?: number;
} & Partial<ViewProps>) => {
	const { css } = useYoshiki();
	const ref = useRef<View>(null);
	const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const [isSeeking, setSeek] = useState(false);
	const [isHover, setHover] = useState(false);
	const [isFocus, setFocus] = useState(false);
	const smallBar = !(isSeeking || isHover || isFocus);

	const ts = (value: number) => px(value * size);

	const change = (event: GestureResponderEvent) => {
		event.preventDefault();
		const locationX = Platform.select({
			android: event.nativeEvent.pageX - layout.x,
			default: event.nativeEvent.locationX,
		});
		setProgress(Math.max(0, Math.min(locationX / layout.width, 1)) * max);
	};

	return (
		<View
			ref={ref}
			// @ts-expect-error Web only
			onMouseEnter={() => setHover(true)}
			// @ts-expect-error Web only
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
			{...css(
				{
					paddingVertical: ts(1),
					// @ts-expect-error Web only
					cursor: "pointer",
					...focusReset,
				},
				props,
			)}
		>
			<View
				{...css([
					{
						width: percent(100),
						height: ts(1),
						bg: (theme) => theme.overlay0,
					},
					smallBar && { transform: "scaleY(0.4)" as any },
				])}
			>
				{subtleProgress !== undefined && (
					<View
						{...css(
							{
								bg: (theme) => theme.overlay1,
								position: "absolute",
								top: 0,
								bottom: 0,
								left: 0,
							},
							{
								style: {
									width: percent((subtleProgress / max) * 100),
								},
							},
						)}
					/>
				)}
				<View
					{...css(
						{
							bg: (theme) => theme.accent,
							position: "absolute",
							top: 0,
							bottom: 0,
							left: 0,
						},
						{
							// In an inline style because yoshiki's insertion can not catch up with the constant redraw
							style: {
								width: percent((progress / max) * 100),
							},
						},
					)}
				/>
				{markers?.map((x) => (
					<View
						key={x}
						{...css({
							position: "absolute",
							top: 0,
							bottom: 0,
							left: percent(Math.min(100, (x / max) * 100)),
							bg: (theme) => theme.accent,
							width: ts(0.5),
							height: ts(1),
						})}
					/>
				))}
			</View>
			<View
				{...css(
					[
						{
							position: "absolute",
							top: 0,
							bottom: 0,
							marginY: ts(0.5),
							bg: (theme) => theme.accent,
							width: ts(2),
							height: ts(2),
							borderRadius: ts(1),
							marginLeft: ts(-1),
						},
						smallBar && { opacity: 0 },
					],
					{
						style: {
							left: percent((progress / max) * 100),
						},
					},
				)}
			/>
		</View>
	);
};
