import type { GestureResponderEvent } from "react-native";
import { View } from "react-native";
import { cn } from "~/utils";
import { Link } from "./links";
import { Skeleton } from "./skeleton";
import { P } from "./text";
import { capitalize } from "./utils";

export const Chip = ({
	size = "medium",
	outline = false,
	label,
	href,
	replace,
	className,
	...props
}: {
	size?: "small" | "medium" | "large";
	outline?: boolean;
	label: string;
	href: string | null;
	replace?: boolean;
	onPress?: (e: GestureResponderEvent) => void;
	className?: string;
}) => {
	return (
		<Link
			href={href}
			replace={replace}
			className={cn(
				"group justify-center overflow-hidden rounded-4xl border border-accent outline-0",
				size === "small" && "px-2.5 py-1",
				size === "medium" && "px-5 py-2",
				size === "large" && "px-10 py-4",
				outline && "highlighted:bg-accent",
				!outline && "bg-accent highlighted:bg-transparent",
				"highlighted:outline-3 highlighted:outline-accent",
				className,
			)}
			{...props}
		>
			{/* the label flips with the background — a child cannot match its parent's
			    `:focus`, see item-grid for the why. */}
			{({ focused, hovered }) => {
				const highlighted = focused || hovered || undefined;
				return (
					<P
						data-highlighted={highlighted}
						className={cn(
							outline &&
								cn("dark:text-slate-300", "data-highlighted:text-slate-200"),
							!outline &&
								cn(
									"text-slate-200 dark:text-slate-300",
									"data-highlighted:text-slate-600",
									"dark:data-highlighted:text-slate-300",
								),
							size === "small" && "text-sm",
						)}
					>
						{capitalize(label)}
					</P>
				);
			}}
		</Link>
	);
};

Chip.Loader = ({
	size = "medium",
	outline = false,
	className,
	...props
}: {
	size?: "small" | "medium" | "large";
	outline?: boolean;
	className?: string;
}) => {
	return (
		<View
			className={cn(
				"justify-center overflow-hidden rounded-4xl border border-accent outline-0",
				size === "small" && "px-2.5 py-1",
				size === "medium" && "px-5 py-2",
				size === "large" && "px-10 py-4",
				!outline && "bg-accent",
				className,
			)}
			{...props}
		>
			<Skeleton className="w-10" />
		</View>
	);
};
