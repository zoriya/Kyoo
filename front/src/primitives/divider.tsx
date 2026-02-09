import { HR as EHR } from "@expo/html-elements";
import { cn } from "~/utils";

export const HR = ({
	orientation = "horizontal",
	className,
	...props
}: {
	orientation?: "vertical" | "horizontal";
	className?: string;
}) => {
	return (
		<EHR
			className={cn(
				"shrink-0 border-0 bg-gray-400 opacity-70",
				orientation === "vertical" && "mx-4 my-2 h-auto w-px",
				orientation === "horizontal" && "mx-2 my-4 h-px w-auto",
				className,
			)}
			{...props}
		/>
	);
};
