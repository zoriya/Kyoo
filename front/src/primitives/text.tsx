import {
	H1 as EH1,
	H2 as EH2,
	H3 as EH3,
	H4 as EH4,
	H5 as EH5,
	H6 as EH6,
	P as EP,
} from "@expo/html-elements";
import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import ExpandLess from "@material-symbols/svg-400/rounded/keyboard_arrow_up-fill.svg";
import {
	type ComponentProps,
	type ComponentType,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Platform, Text, View, type ViewProps } from "react-native";
import { cn } from "~/utils";
import { IconButton } from "./icons";
import { tooltip } from "./tooltip";

const styleText = (
	Component: ComponentType<ComponentProps<typeof EP>>,
	type?: "header" | "sub",
	custom?: string,
) => {
	const Text = ({ className, style, ...props }: ComponentProps<typeof EP>) => {
		return (
			<Component
				className={cn(
					"shrink font-sans text-base text-slate-600 dark:text-slate-400",
					type === "header" &&
						"font-headers text-slate-900 dark:text-slate-200",
					type === "sub" && "font-light text-sm opacity-80",
					custom,
					className,
				)}
				{...props}
			/>
		);
	};
	return Text;
};

export const H1 = styleText(EH1, "header", cn("font-extrabold text-5xl"));
export const H2 = styleText(EH2, "header", cn("text-2xl"));
export const H3 = styleText(EH3, "header");
export const H4 = styleText(EH4, "header");
export const H5 = styleText(EH5, "header");
export const H6 = styleText(EH6, "header");
export const Heading = styleText(Text as any, "header");
export const P = styleText(Text as any, undefined);
export const SubP = styleText(Text as any, "sub");

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
					setNeedExpand(visible !== children);
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
