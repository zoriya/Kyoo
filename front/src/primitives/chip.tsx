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
	target,
	className,
	...props
}: {
	size?: "small" | "medium" | "large";
	outline?: boolean;
	label: string;
	href: string | null;
	replace?: boolean;
	target?: string;
	className?: string;
}) => {
	return (
		<Link
			href={href}
			replace={replace}
			target={target}
			className={cn(
				"group justify-center overflow-hidden rounded-4xl border border-accent outline-0",
				size === "small" && "px-2.5 py-1",
				size === "medium" && "px-5 py-2",
				size === "large" && "px-10 py-4",
				outline && "hover:bg-accent focus:bg-accent",
				!outline && "bg-accent hover:bg-background focus:bg-background",
				className,
			)}
			{...props}
		>
			<P
				className={cn(
					outline &&
						cn(
							"dark:text-slate-300",
							"group-hover:text-slate-200 group-focus:text-slate-200",
						),
					!outline &&
						cn(
							"text-slate-200 dark:text-slate-300",
							"group-hover:text-slate-600 group-focus:text-slate-600",
							"dark:group-focus:text-slate-300 dark:group-hover:text-slate-300",
						),
					size === "small" && "text-sm",
				)}
			>
				{capitalize(label)}
			</P>
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
				"group justify-center overflow-hidden rounded-4xl border border-accent outline-0",
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
