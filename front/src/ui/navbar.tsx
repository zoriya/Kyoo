import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import Browse from "@material-symbols/svg-400/rounded/browse-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close.svg";
import Login from "@material-symbols/svg-400/rounded/login.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import Person from "@material-symbols/svg-400/rounded/person-fill.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Settings from "@material-symbols/svg-400/rounded/settings.svg";
import { useIsFocused } from "@react-navigation/native";
import { useNavigation, usePathname, useRouter } from "expo-router";
import KyooLongLogo from "public/icon-long.svg";
import {
	type ComponentProps,
	type ComponentType,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
	Platform,
	type PressableProps,
	Text,
	TextInput,
	type TextInputProps,
	View,
	type ViewProps,
} from "react-native";
import Animated, {
	interpolate,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import {
	A,
	Avatar,
	HR,
	Icon,
	IconButton,
	Menu,
	PressableFeedback,
	tooltip,
} from "~/primitives";
import { useAccount, useAccounts } from "~/providers/account-context";
import { logout } from "~/ui/login/logic";
import { cn, useQueryState } from "~/utils";

export const NavbarLeft = () => {
	const { t } = useTranslation();
	const account = useAccount();

	if (Platform.OS !== "web") return <NavbarTitle />;

	return (
		<View className="flex-row items-center gap-4">
			<NavbarTitle />
			<NavbarLink href="/browse" label={t("navbar.browse")} icon={Browse} />
			<NavbarLink
				href="/profiles/me"
				label={t("navbar.profile")}
				icon={Person}
			/>
			{account?.isAdmin && (
				<Menu Trigger={NavbarLink} label={t("navbar.admin")} icon={Admin}>
					<Menu.Item
						label={t("admin.unmatched.label")}
						icon={Search}
						href="/admin/unmatched"
					/>
					<Menu.Item label="Users" icon={Admin} href="/admin/users" />
				</Menu>
			)}
		</View>
	);
};

const NavbarLink = <AsProps = ComponentProps<typeof A>>({
	as,
	label,
	icon,
	...props
}: {
	as?: ComponentType<AsProps>;
	label: string;
	icon: ComponentProps<typeof Icon>["icon"];
} & AsProps) => {
	const As = as ?? A;
	return (
		<As
			aria-label={label}
			className="items-center justify-center"
			{...tooltip(label)}
			{...(props as any)}
		>
			<Icon
				icon={icon}
				className="fill-slate-200 sm:hidden dark:fill-slate-200"
			/>
			<Text className="font-headers text-lg text-slate-200 uppercase max-sm:hidden dark:text-slate-200">
				{label}
			</Text>
		</As>
	);
};

export const NavbarTitle = ({
	className,
	...props
}: Partial<ComponentProps<typeof A>>) => {
	const { t } = useTranslation();

	return (
		<A
			href="/"
			aria-label={t("navbar.home")}
			className={cn("m-2 flex flex-1 items-center", className)}
			{...tooltip(t("navbar.home"))}
			{...props}
		>
			<KyooLongLogo style={{ height: 24, width: (531.15 / 149) * 24 }} />
		</A>
	);
};

export const NavbarRight = () => {
	const router = useRouter();
	const path = usePathname();
	const [q, setQuery] = useQueryState<string | undefined>("q", undefined);

	return (
		<View className="shrink flex-row items-center">
			<SearchBar
				key={path}
				value={path === "/browse" ? q : undefined}
				onChangeText={(query) => {
					if (path === "/browse") {
						setQuery(query ?? undefined);
					}
				}}
				onSubmitEditing={(e) => {
					const query = e.nativeEvent.text;
					if (query && path !== "/browse") {
						router.push(`/browse?q=${query}`);
					}
				}}
			/>
			<NavbarProfile />
		</View>
	);
};

export const SearchBar = ({
	value,
	onChangeText,
	onSubmitEditing,
	onBlur,
	onFocus,
	className,
	containerClassName,
	forceExpand,
	...props
}: TextInputProps & { forceExpand?: boolean; containerClassName?: string }) => {
	const { t } = useTranslation();
	const [_expanded, setExpanded] = useState(!!value);
	const inputRef = useRef<TextInput>(null);

	const expanded = _expanded || forceExpand;

	return (
		<Animated.View
			className={cn(
				"mr-2 flex-row items-center overflow-hidden rounded-full p-0 pl-4",
				expanded ? "bg-slate-100 dark:bg-slate-800" : "bg-transparent",
				containerClassName,
			)}
			style={[
				expanded ? { flex: 1 } : { flex: Platform.OS === "web" ? 1 : 0 },
				{
					transitionProperty: "backgroundColor",
					transitionDuration: "300ms",
				},
			]}
		>
			<TextInput
				ref={inputRef}
				value={value}
				onChangeText={(q) => onChangeText?.(q)}
				onSubmitEditing={(e) => onSubmitEditing?.(e)}
				onFocus={(e) => {
					onFocus?.(e);
					setExpanded(true);
				}}
				onBlur={(e) => {
					onBlur?.(e);
					if (!value) setExpanded(false);
				}}
				placeholder={t("navbar.search")}
				textAlignVertical="center"
				className={cn(
					"h-full flex-1 font-sans text-base outline-0",
					"align-middle text-slate-600 dark:text-slate-200",
					!expanded && "w-0 grow-0",
					className,
				)}
				verticalAlign="middle"
				// @ts-expect-error not yet in typescript i think
				includeFontPadding={false}
				placeholderTextColorClassName="accent-slate-400 dark:text-slate-600"
				{...props}
			/>

			<IconButton
				icon={expanded ? Close : Search}
				// need to use onPressIn due to:
				//  https://github.com/react-navigation/react-navigation/issues/12274
				//  https://github.com/react-navigation/react-navigation/issues/12667
				onPressIn={() => {
					console.log(expanded);
					if (expanded) {
						inputRef.current?.blur();
						inputRef.current?.clear();
						onChangeText?.("");
						setExpanded(false);
					} else {
						setExpanded(true);
						// Small delay to allow animation to start before focusing
						setTimeout(() => inputRef.current?.focus(), 100);
					}
				}}
				iconClassName={cn(
					expanded
						? "fill-slate-500 dark:fill-slate-500"
						: "fill-slate-200 dark:fill-slate-200",
				)}
				{...tooltip(t("navbar.search"))}
			/>
		</Animated.View>
	);
};

const getDisplayUrl = (url: string) => {
	url = url.replace(/\/api$/, "");
	url = url.replace(/https?:\/\//, "");
	return url;
};

export const NavbarProfile = () => {
	const { t } = useTranslation();
	const account = useAccount();
	const accounts = useAccounts();

	return (
		<Menu
			Trigger={Avatar<PressableProps>}
			as={PressableFeedback}
			src={account?.logo}
			placeholder={account?.username}
			alt={t("navbar.login")}
			className="m-2"
			{...tooltip(account?.username ?? t("navbar.login"))}
		>
			{accounts?.map((x) => (
				<Menu.Item
					key={x.id}
					label={
						Platform.OS === "web"
							? x.username
							: `${x.username} - ${getDisplayUrl(x.apiUrl)}`
					}
					left={
						<Avatar placeholder={x.username} src={x.logo} className="mx-2" />
					}
					selected={x.selected}
					onSelect={() => x.select()}
				/>
			))}
			{accounts.length > 0 && <HR />}
			<Menu.Item label={t("misc.settings")} icon={Settings} href="/settings" />
			{!account ? (
				<>
					<Menu.Item label={t("login.login")} icon={Login} href="/login" />
					<Menu.Item
						label={t("login.register")}
						icon={Register}
						href="/register"
					/>
				</>
			) : (
				<>
					<Menu.Item
						label={t("login.add-account")}
						icon={Login}
						href="/login"
					/>
					<Menu.Item
						label={t("login.logout")}
						icon={Logout}
						onSelect={logout}
					/>
				</>
			)}
		</Menu>
	);
};

export const useScrollNavbar = ({
	imageHeight,
	tab = false,
}: {
	imageHeight: number;
	tab?: boolean;
}) => {
	const insets = useSafeAreaInsets();
	const height = insets.top + (Platform.OS === "ios" ? 44 : 56);

	const scrollY = useSharedValue(0);
	const scrollHandler = useAnimatedScrollHandler((event) => {
		scrollY.value = event.contentOffset.y;
	});
	const opacity = useAnimatedStyle(
		() => ({
			opacity: interpolate(scrollY.value, [0, imageHeight - height], [0, 1]),
		}),
		[imageHeight, height],
	);
	const reverse = useAnimatedStyle(
		() => ({
			opacity: interpolate(scrollY.value, [0, imageHeight - height], [1, 0]),
		}),
		[imageHeight, height],
	);

	const nav = useNavigation();
	const focused = useIsFocused();
	const accent = useCSSVariable("--color-accent");
	useLayoutEffect(() => {
		const n = tab ? nav.getParent() : nav;
		if (focused) {
			n?.setOptions({
				headerTransparent: true,
				headerStyle: { backgroundColor: "transparent" },
			});
		}
		return () =>
			n?.setOptions({
				headerTransparent: false,
				headerStyle: { backgroundColor: accent as string },
			});
	}, [nav, tab, focused, accent]);

	return {
		scrollHandler,
		headerProps: {
			opacity,
			reverse,
			height,
			focused,
		},
		headerHeight: height,
	};
};

export const HeaderBackground = ({
	children,
	opacity,
	reverse,
	height,
	focused,
	className,
	style,
	...props
}: ViewProps & ReturnType<typeof useScrollNavbar>["headerProps"]) => {
	// this is to handle transparent modals, to prevent duplicated header bar.
	if (!focused) return null;
	return (
		<>
			<Animated.View
				className={cn("absolute z-10 w-full bg-accent", className)}
				style={[{ height }, opacity, style]}
				{...props}
			/>
			<Animated.View
				className={cn(
					"absolute z-10 w-full bg-linear-to-b from-slate-950/70 to-transparent",
					className,
				)}
				style={[{ height }, reverse, style]}
				{...props}
			/>
			{children}
		</>
	);
};
