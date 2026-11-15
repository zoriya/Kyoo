import { useRecyclingState } from "@legendapp/list/react-native";
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
	type PressableProps,
	Text,
	type TextInstance,
	type TextProps,
	View,
	type ViewInstance,
	type ViewProps,
} from "react-native";
import { cn } from "~/utils";
import { IconButton } from "./icons";
import { tooltip } from "./tooltip";

type StyledTextProps = { ref?: Ref<TextInstance> } & TextProps;

const StyledText = ({
	type,
	className,
	...props
}: { type: "header" | "sub" | null } & StyledTextProps) => {
	return (
		<Text
			className={cn(
				"shrink font-sans text-base text-slate-600 dark:text-slate-400",
				type === "header" && "font-headers text-slate-900 dark:text-slate-200",
				type === "sub" && "text-sm font-light opacity-80",
				className,
			)}
			{...props}
		/>
	);
};

export const H1 = ({ className, ...props }: StyledTextProps) => (
	<StyledText
		type="header"
		role="heading"
		aria-level={1}
		className={cn("text-5xl font-extrabold", className)}
		{...props}
	/>
);
export const H2 = ({ className, ...props }: StyledTextProps) => (
	<StyledText
		type="header"
		role="heading"
		aria-level={2}
		className={cn("text-2xl", className)}
		{...props}
	/>
);
export const H3 = (props: StyledTextProps) => (
	<StyledText type="header" role="heading" aria-level={3} {...props} />
);
export const H4 = (props: StyledTextProps) => (
	<StyledText type="header" role="heading" aria-level={4} {...props} />
);
export const H5 = (props: StyledTextProps) => (
	<StyledText type="header" role="heading" aria-level={5} {...props} />
);
export const H6 = (props: StyledTextProps) => (
	<StyledText type="header" role="heading" aria-level={6} {...props} />
);
export const Heading = (props: StyledTextProps) => (
	<StyledText type="header" role="heading" {...props} />
);
export const P = (props: StyledTextProps) => (
	<StyledText type={null} {...props} />
);
export const SubP = (props: StyledTextProps) => (
	<StyledText type="sub" {...props} />
);

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
	iconProps,
	containerProps,
	children,
	...props
}: {
	containerProps?: ViewProps;
	iconProps?: Partial<
		ComponentProps<typeof IconButton<PressableProps>> & {
			ref?: Ref<ViewInstance>;
		}
	>;
} & ComponentProps<typeof P>) => {
	const desc = useRef<HTMLElement>(null);
	const [expended, setExpanded] = useRecyclingState(false);
	const [needExpand, setNeedExpand] = useState(false);
	const { t } = useTranslation();

	useLayoutEffect(() => {
		if (Platform.OS !== "web" || !desc.current || expended) return;
		setNeedExpand(desc.current.scrollHeight > desc.current.clientHeight + 1);
	});

	return (
		<View className="flex-row justify-between" {...(containerProps ?? {})}>
			<P
				ref={(node) => {
					desc.current = node as unknown as HTMLElement | null;
					if (typeof ref === "function") ref(node);
					else if (ref) ref.current = node;
				}}
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
					{...iconProps}
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
