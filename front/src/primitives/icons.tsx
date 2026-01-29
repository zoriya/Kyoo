import type { ComponentProps, ComponentType } from "react";
import { Animated, type PressableProps } from "react-native";
import type { SvgProps } from "react-native-svg";
import { withUniwind } from "uniwind";
import { cn } from "~/utils";
import { PressableFeedback } from "./links";
import { P } from "./text";

export type Icon = ComponentType<SvgProps>;

const IconWrapper = ({ icon: Icon, ...props }: { icon: Icon } & SvgProps) => {
	return <Icon {...props} />;
};

const BaseIcon = withUniwind(IconWrapper, {
	stroke: {
		fromClassName: "strokeClassName",
		styleProperty: "accentColor",
	},
	fill: {
		fromClassName: "fillClassName",
		styleProperty: "accentColor",
	},
});

export const Icon = ({
	className,
	fillClassName,
	...props
}: ComponentProps<typeof BaseIcon>) => {
	return (
		<BaseIcon
			fillClassName={cn(
				"accent-slate-600 dark:accent-slate-400",
				fillClassName,
			)}
			className={cn("h-6 w-6 shrink-0", className)}
			{...props}
		/>
	);
};

export const IconButton = <AsProps = PressableProps>({
	icon,
	as,
	className,
	iconProps,
	...asProps
}: {
	as?: ComponentType<AsProps>;
	icon: Icon;
	iconProps?: Exclude<ComponentProps<typeof Icon>, "icon">;
	className?: string;
} & AsProps) => {
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
			<Icon icon={icon} />
		</Container>
	);
};

const AIconButton = Animated.createAnimatedComponent(IconButton);

export const IconFab = <AsProps = PressableProps>({
	icon,
	className,
	iconProps,
	...props
}: ComponentProps<typeof IconButton<AsProps>>) => {
	return (
		<AIconButton
			icon={icon}
			className={cn("bg-accent", className)}
			iconProps={{
				...iconProps,
				className: cn("text-slate-900", iconProps?.className),
			}}
			style={{
				transform: [{ scale: 1.3 }],
				transitionProperty: "transform",
				transitionDuration: 3000,
			}}
			{...(props as AsProps)}
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
