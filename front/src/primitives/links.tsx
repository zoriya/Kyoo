import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
	Linking,
	Platform,
	Pressable,
	type PressableProps,
	type TextProps,
} from "react-native";
import { useResolveClassNames } from "uniwind";
import { cn } from "~/utils";
import { P } from "./text";

export function useLinkTo({
	href,
	replace = false,
}: {
	href?: string | null;
	replace?: boolean;
}) {
	const router = useRouter();

	if (!href) {
		return {};
	}

	return {
		// @ts-expect-error href is not known
		href: href,
		onPress: (e) => {
			if (e?.defaultPrevented) return;
			// prevent native navigation via href.
			e?.preventDefault();
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
	className,
	...props
}: TextProps & {
	href?: string | null;
	target?: string;
	replace?: boolean;
	children: ReactNode;
}) => {
	const linkProps = useLinkTo({ href, replace });

	return (
		<P
			{...linkProps}
			className={cn(
				"select-text text-accent hover:underline focus:underline",
				className,
			)}
			{...props}
		>
			{children}
		</P>
	);
};

export const PressableFeedback = ({ children, ...props }: PressableProps) => {
	const { color } = useResolveClassNames("text-slate-400/25");

	return (
		<Pressable
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
	children,
	...props
}: {
	href?: string | null;
	replace?: boolean;
	download?: boolean;
	target?: string;
} & PressableProps) => {
	const linkProps = useLinkTo({ href, replace });

	return (
		<PressableFeedback
			{...linkProps}
			{...props}
			disabled={!href}
			onPress={(e?: any) => {
				if (!href) return;
				props?.onPress?.(e);
				if (e?.defaultPrevented) return;
				else linkProps.onPress?.(e);
			}}
		>
			{children}
		</PressableFeedback>
	);
};
