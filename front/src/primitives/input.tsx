import { type ReactNode, type Ref, useState } from "react";
import {
	TextInput,
	type TextInputProps,
	View,
	type ViewStyle,
} from "react-native";
import { px, type Theme, useYoshiki } from "yoshiki/native";
import type { YoshikiEnhanced } from "./image";
import { focusReset, ts } from "./utils";

export const Input = ({
	placeholderTextColor,
	variant = "small",
	right,
	containerStyle,
	ref,
	...props
}: {
	variant?: "small" | "big";
	right?: ReactNode;
	containerStyle?: YoshikiEnhanced<ViewStyle>;
	ref?: Ref<TextInput>;
} & TextInputProps) => {
	const [focused, setFocused] = useState(false);
	const { css, theme } = useYoshiki();

	return (
		<View
			{...css([
				{
					borderColor: (theme) => theme.accent,
					borderRadius: ts(1),
					borderWidth: px(1),
					borderStyle: "solid",
					padding: ts(0.5),
					flexDirection: "row",
					alignContent: "center",
					alignItems: "center",
				},
				variant === "big" && {
					borderRadius: ts(4),
					p: ts(1),
				},
				focused && {
					borderWidth: px(2),
				},
				containerStyle,
			])}
		>
			<TextInput
				ref={ref}
				placeholderTextColor={placeholderTextColor ?? theme.paragraph}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				{...css(
					{
						flexGrow: 1,
						color: (theme: Theme) => theme.paragraph,
						borderWidth: 0,
						...focusReset,
					},
					props,
				)}
			/>
			{right}
		</View>
	);
};
