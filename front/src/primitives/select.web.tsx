import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import ExpandLess from "@material-symbols/svg-400/rounded/keyboard_arrow_up-fill.svg";
import * as RSelect from "@radix-ui/react-select";
import { forwardRef } from "react";
import { Platform, View } from "react-native";
import { cn } from "~/utils";
import { Icon } from "./icons";
import { PressableFeedback } from "./links";
import { InternalTriger } from "./menu.web";
import { P } from "./text";

export const Select = ({
	label,
	value,
	onValueChange,
	values,
	getLabel,
}: {
	label: string;
	value: string;
	onValueChange: (v: string) => void;
	values: string[];
	getLabel: (key: string) => string;
}) => {
	return (
		<RSelect.Root value={value} onValueChange={onValueChange}>
			<RSelect.Trigger aria-label={label} asChild>
				<InternalTriger
					Component={Platform.OS === "web" ? "div" : PressableFeedback}
					className={cn(
						"group flex-row items-center justify-center overflow-hidden rounded-4xl",
						"border-2 border-accent p-1 outline-0 focus-within:bg-accent hover:bg-accent",
					)}
				>
					<View className="flex-row items-center px-6">
						<P className="text-center group-focus-within:text-slate-200 group-hover:text-slate-200">
							{<RSelect.Value />}
						</P>
						<RSelect.Icon className="flex justify-center">
							<Icon
								icon={ExpandMore}
								className="group-focus-within:fill-slate-200 group-hover:fill-slate-200"
							/>
						</RSelect.Icon>
					</View>
				</InternalTriger>
			</RSelect.Trigger>
			<RSelect.Portal>
				<RSelect.Content
					className="z-10 min-w-3xs overflow-auto rounded bg-popover shadow-xl"
					style={{
						maxHeight:
							"calc(var(--radix-dropdown-menu-content-available-height) * 0.8)",
					}}
				>
					<RSelect.ScrollUpButton className="flex justify-center">
						<Icon icon={ExpandLess} />
					</RSelect.ScrollUpButton>
					<RSelect.Viewport>
						{values.map((x) => (
							<Item key={x} label={getLabel(x)} value={x} />
						))}
					</RSelect.Viewport>
					<RSelect.ScrollDownButton className="flex justify-center">
						<Icon icon={ExpandMore} />
					</RSelect.ScrollDownButton>
				</RSelect.Content>
			</RSelect.Portal>
		</RSelect.Root>
	);
};

const Item = forwardRef<HTMLDivElement, { label: string; value: string }>(
	function Item({ label, value, ...props }, ref) {
		return (
			<RSelect.Item
				ref={ref}
				value={value}
				className={cn(
					"flex select-none items-center rounded py-2 pr-6 pl-8 outline-0",
					"font-sans text-slate-600 dark:text-slate-400",
					"group data-highlighted:bg-accent data-highlighted:text-slate-200",
				)}
				{...props}
			>
				<RSelect.ItemText className={cn()}>{label}</RSelect.ItemText>
				<RSelect.ItemIndicator asChild>
					<InternalTriger
						Component={Icon}
						icon={Check}
						className={cn(
							"absolute left-0 w-6 items-center justify-center",
							"group-data-highlighted:fill-slate-200",
						)}
					/>
				</RSelect.ItemIndicator>
			</RSelect.Item>
		);
	},
);
