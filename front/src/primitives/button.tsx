import type { ComponentProps, ComponentType, Ref } from "react";
import {
	type Falsy,
	type Pressable,
	type PressableProps,
	View,
} from "react-native";
import { cn } from "~/utils";
import { Icon } from "./icons";
import { PressableFeedback } from "./links";
import { P } from "./text";

export const Button = <AsProps = PressableProps>({
	text,
	icon,
	ricon,
	disabled,
	as,
	ref,
	className,
	...props
}: {
	disabled?: boolean;
	text?: string;
	icon?: ComponentProps<typeof Icon>["icon"] | Falsy;
	ricon?: ComponentProps<typeof Icon>["icon"] | Falsy;
	ref?: Ref<typeof Pressable>;
	className?: string;
	as?: ComponentType<AsProps>;
} & AsProps) => {
	const Container = as ?? PressableFeedback;
	return (
		<Container
			ref={ref}
			disabled={disabled}
			className={cn(
				"flex-row items-center justify-center overflow-hidden",
				"rounded-4xl border-3 border-accent p-1",
				disabled && "border-slate-600",
				"group focus-within:bg-accent hover:bg-accent",
				className,
			)}
			{...(props as AsProps)}
		>
			<View className="flex-row items-center px-6">
				{icon && (
					<Icon
						icon={icon}
						className="mx-2 group-focus-within:fill-slate-200 group-hover:fill-slate-200"
					/>
				)}
				{text && (
					<P className="text-center group-focus-within:text-slate-200 group-hover:text-slate-200">
						{text}
					</P>
				)}
				{ricon && (
					<Icon
						icon={ricon}
						className="mx-2 group-focus-within:fill-slate-200 group-hover:fill-slate-200"
					/>
				)}
			</View>
		</Container>
	);
};
