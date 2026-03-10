import { LegendList } from "@legendapp/list";
import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import SearchIcon from "@material-symbols/svg-400/rounded/search-fill.svg";
import * as Popover from "@radix-ui/react-popover";
import { useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { useInfiniteFetch } from "~/query/query";
import { cn } from "~/utils";
import type { ComboBoxProps } from "./combobox";
import { Icon } from "./icons";
import { PressableFeedback } from "./links";
import { InternalTriger } from "./menu.web";
import { Skeleton } from "./skeleton";
import { P } from "./text";

export const ComboBox = <Data,>({
	label,
	searchPlaceholder,
	value,
	values,
	onValueChange,
	query,
	getKey,
	getLabel,
	getSmallLabel,
	placeholderCount = 4,
	multiple,
	Trigger,
}: ComboBoxProps<Data>) => {
	const [isOpen, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const oldItems = useRef<Data[] | undefined>(undefined);
	let { items, fetchNextPage, hasNextPage, isFetching } = useInfiniteFetch(
		query(search),
	);
	if (items) oldItems.current = items;
	items ??= oldItems.current;

	const data = useMemo(() => {
		const placeholders = [...Array(placeholderCount)].fill(null);
		if (!items) return placeholders;
		return isFetching ? [...items, ...placeholders] : items;
	}, [items, isFetching, placeholderCount]);

	const selectedKeys = useMemo(() => {
		if (multiple) return new Set(values.map(getKey));
		return new Set(value !== null ? [getKey(value as Data)] : []);
	}, [value, values, multiple, getKey]);

	return (
		<Popover.Root
			open={isOpen}
			onOpenChange={(open: boolean) => {
				setOpen(open);
				if (!open) setSearch("");
			}}
		>
			<Popover.Trigger aria-label={label} asChild>
				{Trigger ? (
					<InternalTriger Component={Trigger} />
				) : (
					<InternalTriger
						Component={Platform.OS === "web" ? "div" : PressableFeedback}
						className={cn(
							"group flex-row items-center justify-center overflow-hidden rounded-4xl",
							"border-2 border-accent p-1 outline-0 focus-within:bg-accent hover:bg-accent",
							"cursor-pointer",
						)}
					>
						<View className="flex-row items-center px-6">
							<P className="text-center group-focus-within:text-slate-200 group-hover:text-slate-200">
								{(multiple ? !values.length : !value)
									? label
									: (multiple ? values : [value!])
											.sort((a, b) => getKey(a).localeCompare(getKey(b)))
											.map(getSmallLabel ?? getLabel)
											.join(", ")}
							</P>
							<Icon
								icon={ExpandMore}
								className="group-focus-within:fill-slate-200 group-hover:fill-slate-200"
							/>
						</View>
					</InternalTriger>
				)}
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					sideOffset={4}
					onOpenAutoFocus={(e: Event) => e.preventDefault()}
					className="z-10 flex min-w-3xs flex-col overflow-hidden rounded bg-popover shadow-xl"
					style={{
						maxHeight:
							"calc(var(--radix-popover-content-available-height) * 0.8)",
					}}
				>
					<div
						className={cn(
							"flex flex-row items-center border-accent border-b px-2",
						)}
					>
						<Icon icon={SearchIcon} className="mx-1 shrink-0" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={searchPlaceholder}
							// biome-ignore lint/a11y/noAutofocus: combobox search should auto-focus on open
							autoFocus
							className={cn(
								"w-full bg-transparent py-2 font-sans text-base outline-0",
								"text-slate-600 placeholder:text-slate-600/50 dark:text-slate-400 dark:placeholder:text-slate-400/50",
							)}
						/>
					</div>
					<LegendList
						data={data}
						estimatedItemSize={40}
						keyExtractor={(item: Data | null, index: number) =>
							item ? getKey(item) : `placeholder-${index}`
						}
						renderItem={({ item }: { item: Data | null }) =>
							item ? (
								<ComboBoxItem
									label={getLabel(item)}
									selected={selectedKeys.has(getKey(item))}
									onSelect={() => {
										if (!multiple) {
											onValueChange(item);
											setOpen(false);
											return;
										}

										if (!selectedKeys.has(getKey(item))) {
											onValueChange([...values, item]);
											return;
										}
										onValueChange(
											values.filter((v) => getKey(v) !== getKey(item)),
										);
									}}
								/>
							) : (
								<ComboBoxItemLoader />
							)
						}
						onEndReached={
							hasNextPage && !isFetching ? () => fetchNextPage() : undefined
						}
						onEndReachedThreshold={0.5}
					/>
					<Popover.Arrow className="fill-popover" />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
};

const ComboBoxItem = ({
	label,
	selected,
	onSelect,
}: {
	label: string;
	selected: boolean;
	onSelect: () => void;
}) => {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"flex w-full select-none items-center rounded py-2 pr-6 pl-8 outline-0",
				"font-sans text-slate-600 dark:text-slate-400",
				"hover:bg-accent hover:text-slate-200",
				"group",
			)}
		>
			{selected && (
				<Icon
					icon={Check}
					className={cn(
						"absolute left-0 w-6 items-center justify-center",
						"group-hover:fill-slate-200",
					)}
				/>
			)}
			<span className="text-left group-hover:text-slate-200">{label}</span>
		</button>
	);
};

const ComboBoxItemLoader = () => {
	return (
		<View className="flex h-10 w-full flex-row items-center py-2 pr-6 pl-8">
			<Skeleton className="h-4 w-3/5" />
		</View>
	);
};
