import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
	Linking,
	Platform,
	Pressable,
	type PressableProps,
	Text,
	type TextProps,
} from "react-native";
import { useTheme, useYoshiki } from "yoshiki/native";
import { alpha } from "./theme";

function useLinkTo({
	href,
	replace = false,
}: {
	href: string;
	replace?: boolean;
}) {
	const router = useRouter();

	return {
		// @ts-expect-error href is not known
		href: href,
		onPress: (e) => {
			if (e?.defaultPrevented) return;
			if (href.startsWith("http")) {
				Platform.OS === "web"
					? window.open(href, "_blank")
					: Linking.openURL(href);
			} else {
				replace ? router.replace(href) : router.push(href);
			}
		},
	} satisfies PressableProps;
}

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

export const PressableFeedback = ({ children, ...props }: PressableProps) => {
	const theme = useTheme();

	return (
		<Pressable
			// TODO: Enable ripple on tv. Waiting for https://github.com/react-native-tvos/react-native-tvos/issues/440
			{...(Platform.isTV
				? {}
				: {
						android_ripple: {
							foreground: true,
							color: alpha(theme.contrast, 0.5) as any,
						},
					})}
			{...props}
		>
			{children}
		</Pressable>
	);
};

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
