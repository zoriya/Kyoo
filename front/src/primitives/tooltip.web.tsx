import type { ComponentProps } from "react";
import { Tooltip as RTooltip } from "react-tooltip";
import { useTheme } from "yoshiki/native";

export const tooltip = (tooltip: string, up?: boolean) => ({
	dataSet: {
		tooltipContent: tooltip,
		label: tooltip,
		tooltipPlace: up ? "top" : "bottom",
		tooltipId: "tooltip",
	},
});

export const Tooltip = (props: ComponentProps<typeof RTooltip>) => {
	const theme = useTheme();
	return (
		<RTooltip
			id="tooltip"
			opacity={0.9}
			style={{
				background: theme.contrast,
				color: theme.alternate.contrast,
			}}
			{...props}
		/>
	);
};

export { RTooltip };
