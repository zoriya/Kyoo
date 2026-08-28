import type { ComponentProps, ComponentType } from "react";
import type { PressableProps } from "react-native";
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
	disabled,
	...asProps
}: {
	as?: ComponentType<AsProps>;
	icon: Icon;
	iconClassName?: string;
	className?: string;
	disabled?: boolean;
} & AsProps) => {
	const Container = as ?? PressableFeedback;

	return (
		<Container
			focusRipple
			className={cn(
				"self-center overflow-hidden rounded-full p-2 outline-0",
				"highlighted:bg-gray-400/50",
				"highlighted:outline-3 outline-accent",
				className,
			)}
			disabled={disabled}
			{...(asProps as AsProps)}
		>
			<Icon
				icon={icon}
				className={cn(
					disabled && "fill-slate-400 dark:fill-slate-600",
					iconClassName,
				)}
			/>
		</Container>
	);
};

export const IconFab = <AsProps = PressableProps>({
	icon,
	as,
	className,
	iconClassName,
	...props
}: ComponentProps<typeof IconButton<AsProps>>) => {
	const Container = as ?? PressableFeedback;

	return (
		<Container
			className={cn(
				"group h-10 w-10 overflow-hidden rounded-full bg-accent p-2 outline-0",
				"highlighted:scale-130 transition-transform duration-150",
				"highlighted:outline-3 highlighted:outline-accent",
				className,
			)}
			{...(props as AsProps)}
		>
			<Icon
				icon={icon}
				className={cn(
					"fill-slate-300 dark:fill-slate-300",
					"group-highlighted:fill-slate-200",
					iconClassName,
				)}
			/>
		</Container>
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
