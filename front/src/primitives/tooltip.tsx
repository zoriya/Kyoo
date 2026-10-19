import { type ComponentProps, useState } from "react";
import { ToastAndroid, View } from "react-native";
import { Portal } from "react-native-teleport";
import type { Tooltip as RTooltip } from "react-tooltip";

export const tooltip = (tooltip: string, _up?: boolean) => ({
	onLongPress: () => {
		ToastAndroid.show(tooltip, ToastAndroid.SHORT);
	},
});

export const Tooltip = ({
	isOpen,
	position,
	place,
	offset = 10,
	render,
}: ComponentProps<typeof RTooltip>) => {
	const [size, setSize] = useState({ width: 0, height: 0 });
	if (!isOpen || !position || !render) return null;

	return (
		<Portal hostName="root">
			<View
				pointerEvents="none"
				onLayout={(e) => setSize(e.nativeEvent.layout)}
				className="absolute"
				style={{
					left:
						place === "top-end"
							? position.x - size.width
							: position.x - size.width / 2,
					top: position.y - size.height - offset,
					// it can't be placed before knowing its size
					opacity: size.width ? 1 : 0,
				}}
			>
				{render({ content: null, activeAnchor: null })}
			</View>
		</Portal>
	);
};
