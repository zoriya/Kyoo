import { useLinkTo } from "one";
import { type ReactNode, forwardRef } from "react";
import {
	Platform,
	Pressable,
	type PressableProps,
	Text,
	type TextProps,
	type View,
} from "react-native";
import { useTheme, useYoshiki } from "yoshiki/native";
import { alpha } from "./theme";

export const A = ({
	href,
	replace,
	children,
	...props
}: TextProps & {
	href?: string | null;
	target?: string;
	replace?: boolean;
	children: ReactNode;
}) => {
	const { css, theme } = useYoshiki();
	const linkProps = useLinkTo({ href: href ?? "#", replace });

	return (
		<Text
			{...linkProps}
			{...css(
				{
					fontFamily: theme.font.normal,
					color: theme.link,
					userSelect: "text",
				},
				props,
			)}
		>
			{children}
		</Text>
	);
};

export const PressableFeedback = forwardRef<View, PressableProps>(function Feedback(
	{ children, ...props },
	ref,
) {
	const theme = useTheme();

	return (
		<Pressable
			ref={ref}
			// TODO: Enable ripple on tv. Waiting for https://github.com/react-native-tvos/react-native-tvos/issues/440
			{...(Platform.isTV
				? {}
				: { android_ripple: { foreground: true, color: alpha(theme.contrast, 0.5) as any } })}
			{...props}
		>
			{children}
		</Pressable>
	);
});

export const Link = ({
	href,
	replace,
	children,
	...props
}: {
	href?: string | null;
	replace?: boolean;
	download?: boolean;
	target?: string;
} & PressableProps) => {
	const linkProps = useLinkTo({ href: href ?? "#", replace });

	return (
		<PressableFeedback
			{...linkProps}
			{...props}
			onPress={(e?: any) => {
				props?.onPress?.(e);
				if (e?.defaultPrevented) return;
				else linkProps.onPress(e);
			}}
		>
			{children}
		</PressableFeedback>
	);
};
