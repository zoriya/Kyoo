import type { ComponentProps, ComponentType } from "react";
import { Platform, type PressableProps } from "react-native";
import type { SvgProps } from "react-native-svg";
import type { YoshikiStyle } from "yoshiki";
import { px, type Stylable, type Theme, useYoshiki } from "yoshiki/native";
import { PressableFeedback } from "./links";
import { P } from "./text";
import { type Breakpoint, focusReset, ts } from "./utils";
import { cn } from "~/utils";

export type Icon = ComponentType<SvgProps>;

type IconProps = {
	icon: Icon;
	color?: Breakpoint<string>;
	size?: YoshikiStyle<number | string>;
};

export const Icon = ({ icon: Icon, color, size = 24, ...props }: IconProps) => {
	const { css, theme } = useYoshiki();
	const computed = css(
		{
			width: size,
			height: size,
			fill: color ?? theme.contrast,
			flexShrink: 0,
		} as any,
		props,
	) as any;

	return (
		<Icon
			{...Platform.select<SvgProps>({
				web: computed,
				default: {
					height: computed.style[0]?.height,
					width: computed.style[0]?.width,
					fill: computed.style[0]?.fill,
					...computed,
				},
			})}
		/>
	);
};

export const IconButton = <AsProps = PressableProps>({
	icon,
	size,
	color,
	as,
	className,
	...asProps
}: IconProps & {
	as?: ComponentType<AsProps>;
	className?: string;
} & AsProps) => {
	const { theme } = useYoshiki();

	const Container = as ?? PressableFeedback;

	return (
		<Container
			focusRipple
			className={cn(
				"m-1 self-center overflow-hidden rounded-full p-2",
				"hover:bg-gray-300 focus-visible:bg-gray-300 focus-visible:dark:bg-gray-700 hover:dark:bg-gray-700",
				className,
			)}
			{...(asProps as AsProps)}
		>
			<Icon
				icon={icon}
				size={size}
				color={
					"disabled" in asProps && asProps.disabled ? theme.overlay1 : color
				}
			/>
		</Container>
	);
};

export const IconFab = <AsProps = PressableProps>(
	props: ComponentProps<typeof IconButton<AsProps>>,
) => {
	const { css, theme } = useYoshiki();

	return (
		<IconButton
			color={theme.colors.black}
			{...(css(
				{
					bg: (theme) => theme.accent,
					fover: {
						self: {
							transform: "scale(1.3)" as any,
							bg: (theme: Theme) => theme.accent,
						},
					},
				},
				props,
			) as any)}
		/>
	);
};

export const DottedSeparator = ({
	className,
	...props
}: {
	className?: string;
}) => {
	return (
		<P className={cn("mx-1", className)} {...props}>
			{String.fromCharCode(0x2022)}
		</P>
	);
};
