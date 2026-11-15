import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import {
	TextInput as RNTextInput,
	type TextInputInstance,
	type TextInputProps,
	View,
} from "react-native";
import { cn } from "~/utils";

// rn writes `value` back to the native input when it differs from what was typed. when `value`
// is updated asynchronously (ex: router params) it lags behind and overwrites the text being
// composed by the keyboard (breaks ime & duplicates text on android tv).
// control the input with a local state updated synchronously & ignore echoes of what was typed.
export const TextInput = ({
	value,
	onChangeText,
	...props
}: TextInputProps & { ref?: Ref<TextInputInstance> }) => {
	const [text, setText] = useState(value);
	const typed = useRef<string[]>([]);

	useEffect(() => {
		if (value === undefined) return;
		const idx = typed.current.indexOf(value);
		if (idx !== -1) {
			typed.current.splice(0, idx + 1);
			return;
		}
		typed.current = [];
		setText(value);
	}, [value]);

	return (
		<RNTextInput
			{...props}
			value={value === undefined ? undefined : text}
			onChangeText={(t) => {
				typed.current.push(t);
				setText(t);
				onChangeText?.(t);
			}}
		/>
	);
};

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
	ref?: Ref<TextInputInstance>;
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
