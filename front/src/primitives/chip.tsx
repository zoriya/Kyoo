import { type TextProps, View } from "react-native";
import { px, rem, type Theme, useYoshiki } from "yoshiki/native";
import { Link } from "./links";
import { Skeleton } from "./skeleton";
import { P } from "./text";
import { capitalize, ts } from "./utils";

export const Chip = ({
	color,
	size = "medium",
	outline = false,
	label,
	href,
	replace,
	target,
	textProps,
	...props
}: {
	color?: string;
	size?: "small" | "medium" | "large";
	outline?: boolean;
	label: string;
	href: string | null;
	replace?: boolean;
	target?: string;
	textProps?: TextProps;
}) => {
	const { css } = useYoshiki("chip");

	textProps ??= {};

	const sizeMult = size === "medium" ? 1 : size === "small" ? 0.5 : 1.5;

	return (
		<Link
			href={href}
			replace={replace}
			target={target}
			{...css(
				[
					{
						pY: ts(1 * sizeMult),
						pX: ts(2.5 * sizeMult),
						borderRadius: ts(3),
						overflow: "hidden",
						justifyContent: "center",
					},
					outline && {
						borderColor: color ?? ((theme: Theme) => theme.accent),
						borderStyle: "solid",
						borderWidth: px(1),
						fover: {
							self: {
								bg: (theme: Theme) => theme.accent,
							},
							text: {
								color: (theme: Theme) => theme.alternate.contrast,
							},
						},
					},
					!outline && {
						bg: color ?? ((theme: Theme) => theme.accent),
					},
				],
				props,
			)}
		>
			<P
				{...css(
					[
						"text",
						{
							marginVertical: 0,
							fontSize: rem(0.8),
							color: (theme: Theme) =>
								outline ? theme.contrast : theme.alternate.contrast,
						},
					],
					textProps,
				)}
			>
				{capitalize(label)}
			</P>
		</Link>
	);
};

Chip.Loader = ({
	color,
	size = "medium",
	outline = false,
	...props
}: {
	color?: string;
	size?: "small" | "medium" | "large";
	outline?: boolean;
}) => {
	const { css } = useYoshiki();
	const sizeMult = size === "medium" ? 1 : size === "small" ? 0.5 : 1.5;

	return (
		<View
			{...css(
				[
					{
						pY: ts(1 * sizeMult),
						pX: ts(2.5 * sizeMult),
						borderRadius: ts(3),
						overflow: "hidden",
						justifyContent: "center",
					},
					outline && {
						borderColor: color ?? ((theme: Theme) => theme.accent),
						borderStyle: "solid",
						borderWidth: px(1),
					},
					!outline && {
						bg: color ?? ((theme: Theme) => theme.accent),
					},
				],
				props,
			)}
		>
			<Skeleton {...css({ width: rem(3) })} />
		</View>
	);
};
