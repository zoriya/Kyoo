import { Portal } from "@gorhom/portal";
import { LegendList } from "@legendapp/list";
import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import SearchIcon from "@material-symbols/svg-400/rounded/search-fill.svg";
import { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, TextInput, View } from "react-native";
import { type QueryIdentifier, useInfiniteFetch } from "~/query/query";
import { cn } from "~/utils";
import { Icon, IconButton } from "./icons";
import { PressableFeedback } from "./links";
import { Skeleton } from "./skeleton";
import { P } from "./text";

type ComboBoxSingleProps<Data> = {
	multiple?: false;
	value: Data | null;
	values?: never;
	onValueChange: (item: Data | null) => void;
};

type ComboBoxMultiProps<Data> = {
	multiple: true;
	value?: never;
	values: Data[];
	onValueChange: (items: Data[]) => void;
};

type ComboBoxBaseProps<Data> = {
	label: string;
	searchPlaceholder?: string;
	query: (search: string) => QueryIdentifier<Data>;
	getKey: (item: Data) => string;
	getLabel: (item: Data) => string;
	getSmallLabel?: (item: Data) => string;
	placeholderCount?: number;
};

export type ComboBoxProps<Data> = ComboBoxBaseProps<Data> &
	(ComboBoxSingleProps<Data> | ComboBoxMultiProps<Data>);

export const ComboBox = <Data,>({
	label,
	value,
	values,
	onValueChange,
	query,
	getLabel,
	getSmallLabel,
	getKey,
	searchPlaceholder,
	placeholderCount = 4,
	multiple,
}: ComboBoxProps<Data>) => {
	const [isOpen, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const inputRef = useRef<TextInput>(null);

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
		return new Set(value !== null ? [getKey(value)] : []);
	}, [value, values, multiple, getKey]);

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
						{(multiple ? !values : !value)
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
			</PressableFeedback>
			{isOpen && (
				<Portal>
					<Pressable
						onPress={() => {
							setOpen(false);
							setSearch("");
						}}
						tabIndex={-1}
						className="absolute inset-0 flex-1 bg-transparent"
					/>
					<KeyboardAvoidingView
						behavior="padding"
						className={cn(
							"absolute bottom-0 w-full self-center bg-popover pb-safe sm:mx-12 sm:max-w-2xl",
							"mt-20 max-h-[80vh] rounded-t-4xl pt-8",
							"xl:top-0 xl:right-0 xl:mr-0 xl:rounded-l-4xl xl:rounded-tr-0",
						)}
					>
						<IconButton
							icon={Close}
							onPress={() => {
								setOpen(false);
								setSearch("");
							}}
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
								placeholder={searchPlaceholder}
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
							showsVerticalScrollIndicator={false}
						/>
					</KeyboardAvoidingView>
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
