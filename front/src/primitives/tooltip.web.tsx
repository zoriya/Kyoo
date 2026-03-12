import type { ComponentProps } from "react";
import { Tooltip as RTooltip } from "react-tooltip";
import { useResolveClassNames } from "uniwind";

export const tooltip = (tooltip: string, up?: boolean) => ({
	dataSet: {
		tooltipContent: tooltip,
		label: tooltip,
		tooltipPlace: up ? "top" : "bottom",
		tooltipId: "tooltip",
	},
});

export const Tooltip = (props: ComponentProps<typeof RTooltip>) => {
	const { color: background } = useResolveClassNames(
		"text-color-dark dark:text-color-light",
	);
	const { color } = useResolveClassNames(
		"text-color-light dark:text-color-dark",
	);

	return (
		<RTooltip
			id="tooltip"
			opacity={0.9}
			style={{
				background: background as string,
				color: color as string,
			}}
			{...props}
		/>
	);
};

export { RTooltip };
