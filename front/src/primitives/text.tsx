import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import ExpandLess from "@material-symbols/svg-400/rounded/keyboard_arrow_up-fill.svg";
import {
	type ComponentProps,
	type Ref,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
	Platform,
	Text,
	type TextProps,
	View,
	type ViewProps,
} from "react-native";
import { cn } from "~/utils";
import { IconButton } from "./icons";
import { tooltip } from "./tooltip";

const styleText = (
	type: "header" | "sub" | null,
	{ className: custom, ...customProps }: TextProps,
) => {
	const Wrapped = ({
		className,
		...props
	}: { ref?: Ref<Text> } & TextProps) => {
		return (
			<Text
				className={cn(
					"shrink font-sans text-base text-slate-600 dark:text-slate-400",
					type === "header" &&
						"font-headers text-slate-900 dark:text-slate-200",
					type === "sub" && "font-light text-sm opacity-80",
					custom,
					className,
				)}
				{...customProps}
				{...props}
			/>
		);
	};
	return Wrapped;
};

export const H1 = styleText("header", {
	className: cn("font-extrabold text-5xl"),
	role: "heading",
	// @ts-expect-error not yet added to ts
	"aria-level": 1,
});
export const H2 = styleText("header", {
	className: cn("text-2xl"),
	role: "heading",
	// @ts-expect-error not yet added to ts
	"aria-level": 2,
});
export const H3 = styleText("header", {
	role: "heading",
	// @ts-expect-error not yet added to ts
	"aria-level": 3,
});
export const H4 = styleText("header", {
	role: "heading",
	// @ts-expect-error not yet added to ts
	"aria-level": 4,
});
export const H5 = styleText("header", {
	role: "heading",
	// @ts-expect-error not yet added to ts
	"aria-level": 5,
});
export const H6 = styleText("header", {
	role: "heading",
	// @ts-expect-error not yet added to ts
	"aria-level": 6,
});
export const Heading = styleText("header", { role: "heading" });
export const P = styleText(null, {});
export const SubP = styleText("sub", {});

export const LI = ({
	children,
	className,
	...props
}: ComponentProps<typeof P>) => {
	return (
		<P
			role="listitem"
			className={cn("flex items-center", className)}
			{...props}
		>
			<Text className="h-full px-1">{String.fromCharCode(0x2022)}</Text>
			{children}
		</P>
	);
};

export const CroppedText = ({
	className,
	numberOfLines,
	onTextLayout,
	ref,
	containerProps,
	children,
	...props
}: { containerProps?: ViewProps } & ComponentProps<typeof P>) => {
	const desc = useRef<HTMLElement>(null);
	const [expended, setExpanded] = useState(false);
	const [needExpand, setNeedExpand] = useState(false);
	const { t } = useTranslation();

	useLayoutEffect(() => {
		if (Platform.OS !== "web" || !desc.current || expended) return;
		setNeedExpand(desc.current.scrollHeight > desc.current.clientHeight + 1);
	});

	return (
		<View className="flex-row justify-between" {...(containerProps ?? {})}>
			<P
				ref={ref}
				numberOfLines={expended ? undefined : numberOfLines}
				onTextLayout={(e) => {
					const visible = e.nativeEvent.lines.reduce(
						(acc, line) => acc + line.text,
						"",
					);
					if (!expended)
						setNeedExpand(visible !== children && visible?.length > 0);
				}}
				{...props}
			>
				{children}
			</P>
			{needExpand && (
				<IconButton
					icon={expended ? ExpandLess : ExpandMore}
					{...tooltip(t(expended ? "misc.collapse" : "misc.expand"))}
					onPress={(e) => {
						e.preventDefault();
						setExpanded((isExpanded) => !isExpanded);
					}}
				/>
			)}
		</View>
	);
};
