import { type Falsy, Pressable, View } from "react-native";
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
		<View
			className={cn(
				"flex-row flex-wrap items-center overflow-hidden rounded-4xl border-3 border-accent p-1",
				disabled && "border-slate-600",
				className,
			)}
			{...props}
		>
			{tabs.map((x) => (
				<Pressable
					key={`${x.value}`}
					disabled={disabled}
					onPress={() => setValue(x.value)}
					className={cn(
						"group flex-row items-center justify-center rounded-3xl px-4 py-2 outline-0",
						!(x.value === value) && "hover:bg-accent focus:bg-accent",
						x.value === value && "bg-accent",
					)}
				>
					<Icon
						icon={x.icon}
						className={cn(
							"mx-1",
							x.value === value
								? "fill-slate-200"
								: "group-hover:fill-slate-200 group-focus:fill-slate-200",
						)}
					/>
					<P
						className={cn(
							"ml-1",
							x.value === value
								? "text-slate-200"
								: "group-hover:text-slate-200 group-focus:text-slate-200",
						)}
					>
						{x.label}
					</P>
				</Pressable>
			))}
		</View>
	);
};
