import type { ReactNode, Ref } from "react";
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
	return (
		<View
			className={cn(
				"shrink flex-row content-center items-center rounded-xl border border-accent p-2",
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
					"min-h-6 min-w-0 flex-1 font-sans text-base text-slate-600 dark:text-slate-400",
					// the ring goes on the input rather than around the whole row: only
					// the input can report its own focus to uniwind, a plain view has no
					// `:focus-within` on native.
					"highlighted:outline-3 highlighted:outline-accent",
					className,
				)}
				{...props}
			/>
			{right}
		</View>
	);
};
