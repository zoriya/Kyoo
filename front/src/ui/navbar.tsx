import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import Close from "@material-symbols/svg-400/rounded/close.svg";
import Login from "@material-symbols/svg-400/rounded/login.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Settings from "@material-symbols/svg-400/rounded/settings.svg";
import { useIsFocused } from "@react-navigation/native";
import {
	useGlobalSearchParams,
	useNavigation,
	usePathname,
	useRouter,
} from "expo-router";
import KyooLongLogo from "public/icon-long.svg";
import {
	type ComponentProps,
	type Ref,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
	Platform,
	TextInput,
	type PressableProps,
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
	IconButton,
	Input,
	Link,
	Menu,
	PressableFeedback,
	tooltip,
} from "~/primitives";
import { useAccount, useAccounts } from "~/providers/account-context";
import { logout } from "~/ui/login/logic";
import { cn } from "~/utils";

export const NavbarTitle = ({
	className,
	...props
}: Partial<ComponentProps<typeof A>>) => {
	const { t } = useTranslation();

	return (
		<A
			href="/"
			aria-label={t("navbar.home")}
			className={cn("m-4 flex flex-1 items-center", className)}
			{...tooltip(t("navbar.home"))}
			{...props}
		>
			<KyooLongLogo style={{ height: 24, width: (531.15 / 149) * 24 }} />
		</A>
	);
};

const SearchBar = ({
	ref,
	className,
	...props
}: TextInputProps & { ref?: Ref<TextInput> }) => {
	const { t } = useTranslation();
	const params = useGlobalSearchParams();
	const [query, setQuery] = useState((params.q as string) ?? "");
	const path = usePathname();
	const router = useRouter();
	const inputRef = useRef<TextInput>(null);

	useEffect(() => {
		if (path === "/browse") {
			inputRef.current?.focus();
			setQuery(params.q as string);
		} else {
			inputRef.current?.blur();
			setQuery("");
		}
	}, [path, params.q]);

	return (
		<Input
			ref={inputRef}
			value={query}
			onChangeText={(q) => {
				setQuery(q);
				if (path !== "/browse") router.navigate(`/browse?q=${q}`);
				else router.setParams({ q });
			}}
			placeholder={t("navbar.search")}
			containerClassName="border-light"
			className={cn("text-slate-200 dark:text-slate-200", className)}
			{...tooltip(t("navbar.search"))}
			{...props}
		/>
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

const MobileSearchBar = () => {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);
	const inputRef = useRef<TextInput>(null);

	const router = useRouter();
	const [query, setQuery] = useState("");

	console.log(expanded);

	return (
		<Animated.View
			className={cn(
				"mr-2 flex-row p-0 pl-4",
				"rounded-full bg-slate-100 dark:bg-slate-800",
			)}
			style={[
				expanded ? { flex: 1 } : { backgroundColor: "transparent" },
				{
					transitionProperty: ["width", "background-color"],
					transitionDuration: "300ms",
				},
			]}
		>
			<TextInput
				ref={inputRef}
				value={query}
				onChangeText={(q) => {
					setQuery(q);
					router.setParams({ q });
				}}
				onFocus={() => router.push(query ? `/browse?q=${query}` : "/browse")}
				placeholder={t("navbar.search")}
				textAlignVertical="center"
				className={cn(
					"h-full flex-1 font-sans text-base outline-0",
					"text-slate-600 dark:text-slate-200",
					!expanded && "grow-0",
				)}
				placeholderTextColorClassName="accent-slate-400 dark:text-slate-600"
			/>

			<IconButton
				icon={expanded ? Close : Search}
				onPress={() => {
					if (expanded) {
						inputRef.current?.blur();
						setExpanded(false);
					} else {
						setExpanded(true);
						console.log("set to exampeded");
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

export const NavbarRight = () => {
	const { t } = useTranslation();
	const isAdmin = false; //useHasPermission(AdminPage.requiredPermissions);

	return (
		<View className="shrink flex-row items-center">
			{Platform.OS === "web" ? <SearchBar /> : <MobileSearchBar />}
			{isAdmin && (
				<IconButton
					icon={Admin}
					as={Link}
					href={"/admin"}
					iconClassName="fill-slate-200 dark:fill-slate-200"
					{...tooltip(t("navbar.admin"))}
				/>
			)}
			<NavbarProfile />
		</View>
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
		},
		headerHeight: height,
	};
};

export const HeaderBackground = ({
	children,
	opacity,
	reverse,
	height,
	className,
	style,
	...props
}: ViewProps & ReturnType<typeof useScrollNavbar>["headerProps"]) => {
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
