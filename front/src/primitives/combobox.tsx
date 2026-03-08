import { Portal } from "@gorhom/portal";
import { LegendList } from "@legendapp/list";
import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import SearchIcon from "@material-symbols/svg-400/rounded/search-fill.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { type QueryIdentifier, useInfiniteFetch } from "~/query/query";
import { cn } from "~/utils";
import { Icon, IconButton } from "./icons";
import { PressableFeedback } from "./links";
import { Skeleton } from "./skeleton";
import { P } from "./text";

const useDebounce = <T,>(value: T, delay: number): T => {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
};

export const ComboBox = <Data,>({
	label,
	value,
	onValueChange,
	query,
	getLabel,
	getKey,
	placeholder,
	placeholderCount = 4,
}: {
	label: string;
	value: Data | null;
	onValueChange: (item: Data | null) => void;
	query: (search: string) => QueryIdentifier<Data>;
	getLabel: (item: Data) => string;
	getKey: (item: Data) => string;
	placeholder?: string;
	placeholderCount?: number;
}) => {
	const [isOpen, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);
	const inputRef = useRef<TextInput>(null);

	const currentQuery = query(debouncedSearch);
	const oldItems = useRef<Data[] | undefined>(undefined);
	let { items, fetchNextPage, hasNextPage, isFetching } =
		useInfiniteFetch(currentQuery);
	if (items) oldItems.current = items;
	items ??= oldItems.current;

	const data = useMemo(() => {
		const placeholders = [...Array(placeholderCount)].fill(null);
		if (!items) return placeholders;
		return isFetching ? [...items, ...placeholders] : items;
	}, [items, isFetching, placeholderCount]);

	const handleSelect = (item: Data) => {
		onValueChange(item);
		setOpen(false);
		setSearch("");
	};

	const handleClose = () => {
		setOpen(false);
		setSearch("");
	};

	return (
		<>
			<PressableFeedback
				onPressIn={() => setOpen(true)}
				accessibilityLabel={label}
				className={cn(
					"flex-row items-center justify-center overflow-hidden",
					"rounded-4xl border-3 border-accent p-1 outline-0",
					"group focus-within:bg-accent hover:bg-accent",
				)}
			>
				<View className="flex-row items-center px-6">
					<P className="text-center group-focus-within:text-slate-200 group-hover:text-slate-200">
						{value ? getLabel(value) : (placeholder ?? label)}
					</P>
					<Icon
						icon={ExpandMore}
						className="group-focus-within:fill-slate-200 group-hover:fill-slate-200"
					/>
				</View>
			</PressableFeedback>
			{isOpen && (
				<Portal>
					<Pressable
						onPress={handleClose}
						tabIndex={-1}
						className="absolute inset-0 flex-1 bg-transparent"
					/>
					<View
						className={cn(
							"absolute bottom-0 w-full self-center bg-popover pb-safe sm:mx-12 sm:max-w-2xl",
							"mt-20 max-h-[80vh] rounded-t-4xl pt-8",
							"xl:top-0 xl:right-0 xl:mr-0 xl:rounded-l-4xl xl:rounded-tr-0",
						)}
					>
						<IconButton
							icon={Close}
							onPress={handleClose}
							className="hidden self-end xl:flex"
						/>
						<View
							className={cn(
								"mx-4 mb-2 flex-row items-center rounded-xl border border-accent p-1",
								"focus-within:border-2",
							)}
						>
							<Icon icon={SearchIcon} className="mx-2" />
							<TextInput
								ref={inputRef}
								value={search}
								onChangeText={setSearch}
								placeholder={placeholder ?? label}
								autoFocus
								textAlignVertical="center"
								className="h-full flex-1 font-sans text-base text-slate-600 outline-0 dark:text-slate-400"
							/>
						</View>
						<LegendList
							data={data}
							estimatedItemSize={48}
							keyExtractor={(item: Data | null, index: number) =>
								item ? getKey(item) : `placeholder-${index}`
							}
							renderItem={({ item }: { item: Data | null }) =>
								item ? (
									<ComboBoxItem
										label={getLabel(item)}
										selected={value !== null && getKey(item) === getKey(value)}
										onSelect={() => handleSelect(item)}
									/>
								) : (
									<ComboBoxItemLoader />
								)
							}
							onEndReached={
								hasNextPage && !isFetching ? () => fetchNextPage() : undefined
							}
							onEndReachedThreshold={0.5}
							showsVerticalScrollIndicator={false}
						/>
					</View>
				</Portal>
			)}
		</>
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
		<PressableFeedback
			onPress={onSelect}
			className="h-12 w-full flex-row items-center px-4"
		>
			{selected && <Icon icon={Check} className="mx-6" />}
			<P
				style={{
					paddingLeft: selected ? 0 : 8 * 2 + 24,
				}}
				className="flex-1"
			>
				{label}
			</P>
		</PressableFeedback>
	);
};

const ComboBoxItemLoader = () => {
	return (
		<View className="h-12 w-full flex-row items-center px-4">
			<Skeleton className="ml-14 h-4 w-3/5" />
		</View>
	);
};
