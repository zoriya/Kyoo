import { type ComponentProps, type ComponentType, useState } from "react";
import { Animated, type PressableProps } from "react-native";
import RSvg, { type SvgProps } from "react-native-svg";
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
		fromClassName: "className",
		styleProperty: "accentColor",
	},
	fill: {
		fromClassName: "className",
		styleProperty: "fill",
	},
	width: {
		fromClassName: "className",
		styleProperty: "width",
	},
	height: {
		fromClassName: "className",
		styleProperty: "height",
	},
});

export const Svg = withUniwind(RSvg, {
	stroke: {
		fromClassName: "className",
		styleProperty: "accentColor",
	},
	fill: {
		fromClassName: "className",
		styleProperty: "fill",
	},
	width: {
		fromClassName: "className",
		styleProperty: "width",
	},
	height: {
		fromClassName: "className",
		styleProperty: "height",
	},
});

export const Icon = ({
	className,
	...props
}: ComponentProps<typeof BaseIcon>) => {
	return (
		<BaseIcon
			className={cn(
				"h-6 w-6 shrink-0 fill-slate-600 dark:fill-slate-400",
				className,
			)}
			{...props}
		/>
	);
};

export const IconButton = <AsProps = PressableProps>({
	icon,
	as,
	className,
	iconClassName,
	...asProps
}: {
	as?: ComponentType<AsProps>;
	icon: Icon;
	iconClassName?: string;
	className?: string;
} & AsProps) => {
	const Container = as ?? PressableFeedback;

	return (
		<Container
			focusRipple
			className={cn(
				"self-center overflow-hidden rounded-full p-2",
				"outline-0 hover:bg-gray-400/50 focus-visible:bg-gray-400/50",
				className,
			)}
			{...(asProps as AsProps)}
		>
			<Icon icon={icon} className={iconClassName} />
		</Container>
	);
};

const Pressable = Animated.createAnimatedComponent(PressableFeedback);

export const IconFab = <AsProps = PressableProps>({
	icon,
	className,
	iconClassName,
	...props
}: ComponentProps<typeof IconButton<AsProps>>) => {
	const [hover, setHover] = useState(false);
	const [focus, setFocus] = useState(false);
	return (
		<Pressable
			className={cn(
				"group h-10 w-10 overflow-hidden rounded-full bg-accent p-2 outline-0",
				className,
			)}
			onHoverIn={() => setHover(true)}
			onHoverOut={() => setHover(false)}
			onFocus={() => setFocus(true)}
			onBlur={() => setFocus(false)}
			style={{
				transform: hover || focus ? [{ scale: 1.3 }] : [],
				transitionProperty: "transform",
				transitionDuration: "150ms",
			}}
			{...(props as AsProps)}
		>
			<Icon
				icon={icon}
				className={cn(
					"fill-slate-300 dark:fill-slate-300",
					(hover || focus) && "fill-slate-200 dark:fill-slate-200",
					iconClassName,
				)}
			/>
		</Pressable>
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
