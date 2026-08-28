import { LegendList } from "@legendapp/list/react-native";
import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import SearchIcon from "@material-symbols/svg-400/rounded/search-fill.svg";
import { keepPreviousData } from "@tanstack/react-query";
import {
	type ComponentType,
	type Ref,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	BackHandler,
	KeyboardAvoidingView,
	Pressable,
	type PressableProps,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal } from "react-native-teleport";
import { type QueryIdentifier, useInfiniteFetch } from "~/query/query";
import { cn } from "~/utils";
import { FocusGroup, requestFocus } from "./focus";
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
	searchPlaceholder?: string;
	query: (search: string) => QueryIdentifier<Data>;
	getKey: (item: Data) => string;
	getLabel: (item: Data) => string;
	getSmallLabel?: (item: Data) => string;
	placeholderCount?: number;
	label?: string;
	Trigger?: ComponentType<PressableProps & { ref?: Ref<View> }>;
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
	Trigger,
}: ComboBoxProps<Data>) => {
	const [isOpen, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const inputRef = useRef<TextInput>(null);
	const trigger = useRef<View | null>(null);
	const insets = useSafeAreaInsets();
	const close = () => {
		setOpen(false);
		setSearch("");
	};

	// The trap can only go up once the focus is already inside: a focus guide that
	// traps a direction also refuses to let the focus in through it.
	const [trapped, setTrapped] = useState(false);
	const opened = useRef(false);
	useEffect(() => {
		if (!isOpen) {
			setTrapped(false);
			// the sheet took the selection with it on the way out
			if (opened.current) requestFocus(trigger.current);
			return;
		}
		opened.current = true;
		setTrapped(true);
		// and back has to dismiss the filter rather than the page behind it.
		const back = BackHandler.addEventListener("hardwareBackPress", () => {
			setOpen(false);
			setSearch("");
			return true;
		});
		return () => back.remove();
	}, [isOpen]);

	const { items, fetchNextPage, hasNextPage, isFetching } = useInfiniteFetch({
		...query(search),
		placeholderData: keepPreviousData,
	});

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
			{Trigger ? (
				<Trigger ref={trigger} onPressIn={() => setOpen(true)} />
			) : (
				<PressableFeedback
					ref={trigger}
					onPressIn={() => setOpen(true)}
					accessibilityLabel={label}
					className={cn(
						"flex-row items-center justify-center overflow-hidden",
						"rounded-4xl border-3 border-accent p-1 outline-0",
						"highlighted:bg-accent",
					)}
				>
					{({ focused, hovered }) => {
						const highlighted = focused || hovered || undefined;
						return (
							<View className="flex-row items-center px-6">
								<P
									data-highlighted={highlighted}
									className="text-center data-highlighted:text-slate-200"
								>
									{(multiple ? !values?.length : !value)
										? label
										: (multiple ? values : [value!])
												.sort((a, b) => getKey(a).localeCompare(getKey(b)))
												.map(getSmallLabel ?? getLabel)
												.join(", ")}
								</P>
								<Icon
									icon={ExpandMore}
									data-highlighted={highlighted}
									className="data-highlighted:fill-slate-200"
								/>
							</View>
						);
					}}
				</PressableFeedback>
			)}
			{isOpen && (
				<Portal hostName="root">
					<Pressable
						onPress={close}
						tabIndex={-1}
						className="absolute inset-0 flex-1 bg-transparent"
					/>
					<FocusGroup
						// an open filter is the only thing a remote can reach
						trapFocusUp={trapped}
						trapFocusDown={trapped}
						trapFocusLeft={trapped}
						trapFocusRight={trapped}
						className={cn(
							"absolute bottom-0 w-full self-center bg-popover px-safe sm:mx-12 sm:max-w-2xl",
							"mt-20 max-h-[80vh] rounded-t-4xl pt-8",
							// same as a menu: from a couch a sheet at the bottom of the screen
							// is a long walk down and back, and half of it is off screen.
							"md:top-0 md:right-0 md:mt-0 md:mr-0 md:mb-0 md:max-h-full md:max-w-md",
							"md:rounded-l-4xl md:rounded-tr-0 md:pt-safe xl:max-w-2xl",
						)}
					>
						<KeyboardAvoidingView behavior="padding" className="shrink">
							<IconButton
								icon={Close}
								onPress={close}
								className="hidden self-end md:flex"
							/>
							<View
								className={cn(
									"mx-4 mb-2 flex-row items-center rounded-xl border border-accent p-1",
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
								extraData={selectedKeys}
								contentContainerStyle={{ paddingBottom: insets.bottom }}
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
							/>
						</KeyboardAvoidingView>
					</FocusGroup>
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
			// same highlight as a menu item, this is the same kind of list
			className="h-12 w-full flex-row items-center highlighted:bg-accent px-4"
		>
			{({ focused, hovered }) => {
				const highlighted = focused || hovered || undefined;
				return (
					<>
						{selected && (
							<Icon
								icon={Check}
								data-highlighted={highlighted}
								className="mx-6 data-highlighted:fill-slate-200"
							/>
						)}
						<P
							data-highlighted={highlighted}
							style={{
								paddingLeft: selected ? 0 : 8 * 2 + 24,
							}}
							className="flex-1 data-highlighted:text-slate-200"
						>
							{label}
						</P>
					</>
				);
			}}
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
