import {
	H1 as EH1,
	H2 as EH2,
	H3 as EH3,
	H4 as EH4,
	H5 as EH5,
	H6 as EH6,
	P as EP,
} from "@expo/html-elements";
import type { ComponentProps, ComponentType } from "react";
import { Text } from "react-native";
import { cn } from "~/utils";

const styleText = (
	Component: ComponentType<ComponentProps<typeof EP>>,
	type?: "header" | "sub",
	custom?: string,
) => {
	const Text = ({ className, style, ...props }: ComponentProps<typeof EP>) => {
		return (
			<Component
				className={cn(
					"m-0 shrink text-base text-slate-600 dark:text-slate-400",
					type === "header" && "text-slate-900 dark:text-slate-200",
					type === "sub" && "font-light text-sm opacity-80",
					custom,
					className,
				)}
				// reset expo/html-elements style
				style={[{ marginVertical: 0 }, style]}
				{...props}
			/>
		);
	};
	return Text;
};

export const H1 = styleText(EH1, "header", "text-5xl font-black");
export const H2 = styleText(EH2, "header", "text-2xl");
export const H3 = styleText(EH3, "header");
export const H4 = styleText(EH4, "header");
export const H5 = styleText(EH5, "header");
export const H6 = styleText(EH6, "header");
export const Heading = styleText(EP, "header");
export const P = styleText(EP, undefined);
export const SubP = styleText(EP, "sub");

export const LI = ({ children, ...props }: ComponentProps<typeof P>) => {
	return (
		<P role="listitem" {...props}>
			<Text className="mb-2 h-full pr-1">{String.fromCharCode(0x2022)}</Text>
			{children}
		</P>
	);
};
