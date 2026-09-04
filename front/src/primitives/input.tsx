import { type ReactNode, type Ref, useState } from "react";
import { TextInput, type TextInputProps, View } from "react-native";
import { cn } from "~/utils";

export const Input = ({
	left,
	right,
	containerClassName,
	ref,
	className,
	...props
}: {
	left?: ReactNode;
	right?: ReactNode;
	containerClassName?: string;
	ref?: Ref<TextInput>;
} & TextInputProps) => {
	const [focused, setFocused] = useState(false);

	return (
		<View
			className={cn(
				"shrink flex-row content-center items-center rounded-xl border border-accent p-2",
				"ring-accent focus-within:ring-2",
				focused && "ring-2",
				containerClassName,
			)}
		>
			{left}
			<TextInput
				ref={ref}
				textAlignVertical="center"
				verticalAlign="middle"
				// @ts-expect-error not yet in typescript i think
				includeFontPadding={false}
				className={cn(
					"min-h-6 min-w-0 flex-1 font-sans text-base text-slate-600 outline-0 dark:text-slate-400",
					className,
				)}
				{...props}
				onFocus={(e) => {
					setFocused(true);
					props.onFocus?.(e);
				}}
				onBlur={(e) => {
					setFocused(false);
					props.onBlur?.(e);
				}}
			/>
			{right}
		</View>
	);
};
