import {
	type ComponentType,
	type ForwardedRef,
	forwardRef,
	type ReactElement,
} from "react";
import { type Falsy, type PressableProps, View } from "react-native";
import { type Theme, useYoshiki } from "yoshiki/native";
import { PressableFeedback } from "./links";
import { P } from "./text";
import { ts } from "./utils";

export const Button = forwardRef(function Button<AsProps = PressableProps>(
	{
		children,
		text,
		icon,
		licon,
		disabled,
		as,
		...props
	}: {
		children?: ReactElement | ReactElement[] | Falsy;
		text?: string;
		licon?: ReactElement | Falsy;
		icon?: ReactElement | Falsy;
		disabled?: boolean;
		as?: ComponentType<AsProps>;
	} & AsProps,
	ref: ForwardedRef<unknown>,
) {
	const { css } = useYoshiki("button");

	const Container = as ?? PressableFeedback;
	return (
		<Container
			ref={ref as any}
			disabled={disabled}
			{...(css(
				[
					{
						flexGrow: 0,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						overflow: "hidden",
						p: ts(0.5),
						borderRadius: ts(5),
						borderColor: (theme: Theme) => theme.accent,
						borderWidth: ts(0.5),
						fover: {
							self: { bg: (theme: Theme) => theme.accent },
							text: { color: (theme: Theme) => theme.colors.white },
						},
					},
					disabled && {
						child: {
							self: {
								borderColor: (theme) => theme.overlay1,
							},
							text: {
								color: (theme) => theme.overlay1,
							},
						},
					},
				],
				props as any,
			) as AsProps)}
		>
			{(licon || text || icon) != null && (
				<View
					{...css({
						paddingX: ts(3),
						flexDirection: "row",
						alignItems: "center",
					})}
				>
					{licon}
					{text && <P {...css({ textAlign: "center" }, "text")}>{text}</P>}
					{icon}
				</View>
			)}
			{children}
		</Container>
	);
});
