import { type Falsy, Pressable, ScrollView } from "react-native";
import { cn } from "~/utils";
import { Icon, type Icon as IconType } from "./icons";
import { P } from "./text";

export const Tabs = <T,>({
	tabs: _tabs,
	value,
	setValue,
	className,
	disabled,
	...props
}: {
	tabs: (
		| {
				label: string;
				value: T;
				icon: IconType;
		  }
		| Falsy
	)[];
	value: string;
	setValue: (value: T) => void;
	className?: string;
	disabled?: boolean;
}) => {
	const tabs = _tabs.filter((x) => x) as {
		label: string;
		value: T;
		icon: IconType;
	}[];
	return (
		<ScrollView
			horizontal
			// @ts-expect-error uniwind special props
			containerClassName={cn("shrink flex-row items-center", className)}
			className={cn(
				"rounded-4xl border-3 border-accent p-1",

				disabled && "border-slate-600",
			)}
			{...props}
		>
			{tabs.map((x) => (
				<Pressable
					key={`${x.value}`}
					disabled={disabled}
					onPress={() => setValue(x.value)}
					className={cn(
						"flex-row items-center justify-center rounded-3xl px-4 py-2 outline-0",
						// the fill says which tab you are on, the ring says which one you are
						// about to pick: with a remote those are two different things and
						// filling both leaves nothing to tell them apart.
						x.value === value && "bg-accent",
						"highlighted:outline-3 highlighted:outline-accent",
					)}
				>
					{({ focused, hovered }) => {
						// on the accent either way, see item-grid for why a child cannot
						// read its parent's focus on its own.
						const light = x.value === value || focused || hovered || undefined;
						return (
							<>
								<Icon
									icon={x.icon}
									data-highlighted={light}
									className="mx-1 data-highlighted:fill-slate-200"
								/>
								<P
									data-highlighted={light}
									className="ml-1 data-highlighted:text-slate-200"
								>
									{x.label}
								</P>
							</>
						);
					}}
				</Pressable>
			))}
		</ScrollView>
	);
};
