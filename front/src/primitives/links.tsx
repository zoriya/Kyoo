import { useRouter } from "expo-router";
import type { ReactNode, RefObject } from "react";
import {
	Linking,
	Platform,
	Pressable,
	type PressableProps,
	type TextProps,
	type View,
} from "react-native";
import { useResolveClassNames } from "uniwind";
import { cn } from "~/utils";
import { P } from "./text";

export function useLinkTo({
	href,
	replace = false,
	download,
}: {
	href?: string | null;
	replace?: boolean;
	download?: boolean;
}) {
	const router = useRouter();

	if (!href) {
		return {};
	}

	return {
		// @ts-expect-error href is not known
		href: href,
		download,
		onPress: (e) => {
			if (e?.defaultPrevented || download) return;
			// prevent native navigation via href.
			e?.preventDefault();
			if (href.startsWith("http")) {
				Platform.OS === "web"
					? window.open(href, replace ? "_self" : "_blank")
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
	download,
	children,
	className,
	...props
}: TextProps & {
	href?: string | null;
	replace?: boolean;
	download?: boolean;
	children: ReactNode;
}) => {
	const linkProps = useLinkTo({ href, replace, download });

	return (
		<P
			{...linkProps}
			className={cn(
				"select-text text-accent hover:underline focus:underline dark:text-accent",
				className,
			)}
			{...props}
		>
			{children}
		</P>
	);
};

export const PressableFeedback = ({
	children,
	ref,
	...props
}: PressableProps & { ref?: RefObject<View> }) => {
	const { color } = useResolveClassNames("text-slate-400/25");

	return (
		<Pressable
			ref={ref}
			android_ripple={{
				foreground: true,
				color,
			}}
			{...props}
		>
			{children}
		</Pressable>
	);
};

export const Link = ({
	href,
	replace,
	download,
	children,
	disabled,
	...props
}: {
	href?: string | null;
	replace?: boolean;
	download?: boolean;
} & PressableProps) => {
	const linkProps = useLinkTo({ href, replace, download });

	return (
		<PressableFeedback
			{...linkProps}
			{...props}
			disabled={disabled ?? (!href && !props?.onPress)}
			onPress={(e?: any) => {
				props?.onPress?.(e);
				if (!href) return;
				if (e?.defaultPrevented) return;
				else linkProps.onPress?.(e);
			}}
		>
			{children}
		</PressableFeedback>
	);
};
