import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import Login from "@material-symbols/svg-400/rounded/login.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Settings from "@material-symbols/svg-400/rounded/settings.svg";
import { useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import {
	type Ref,
	useEffect,
	useRef,
	useState,
	type ComponentProps,
} from "react";
import { useTranslation } from "react-i18next";
import {
	Platform,
	type TextInput,
	type TextInputProps,
	View,
	type PressableProps,
} from "react-native";
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
import KyooLongLogo from "public/icon-long.svg";

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
export const NavbarRight = () => {
	const { t } = useTranslation();
	const isAdmin = false; //useHasPermission(AdminPage.requiredPermissions);

	return (
		<View className="shrink flex-row items-center">
			{Platform.OS === "web" ? (
				<SearchBar />
			) : (
				<IconButton
					icon={Search}
					as={Link}
					href={"/browse"}
					iconClassName="fill-slate-200 dark:fill-slate-200"
					{...tooltip(t("navbar.search"))}
				/>
			)}
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

// export const Navbar = ({
// 	left,
// 	right,
// 	background,
// 	...props
// }: {
// 	left?: ReactElement | null;
// 	right?: ReactElement | null;
// 	background?: ReactElement;
// } & Stylable) => {
// 	const { css } = useYoshiki();
// 	const { t } = useTranslation();
//
// 	return (
// 		<Header
// 			{...css(
// 				{
// 					backgroundColor: (theme) => theme.accent,
// 					paddingX: ts(2),
// 					height: { xs: 48, sm: 64 },
// 					flexDirection: "row",
// 					justifyContent: { xs: "space-between", sm: "flex-start" },
// 					alignItems: "center",
// 					shadowColor: "#000",
// 					shadowOffset: {
// 						width: 0,
// 						height: 4,
// 					},
// 					shadowOpacity: 0.3,
// 					shadowRadius: 4.65,
// 					elevation: 8,
// 					zIndex: 1,
// 				},
// 				props,
// 			)}
// 		>
// 			{background}
// 			<View
// 				{...css({
// 					flexDirection: "row",
// 					alignItems: "center",
// 					height: percent(100),
// 				})}
// 			>
// 				{left !== undefined ? (
// 					left
// 				) : (
// 					<>
// 						<NavbarTitle {...css({ marginX: ts(2) })} />
// 						<A
// 							href="/browse"
// 							{...css({
// 								textTransform: "uppercase",
// 								fontWeight: "bold",
// 								color: (theme) => theme.contrast,
// 							})}
// 						>
// 							{t("navbar.browse")}
// 						</A>
// 					</>
// 				)}
// 			</View>
// 			<View
// 				{...css({
// 					flexGrow: 1,
// 					flexShrink: 1,
// 					flexDirection: "row",
// 					display: { xs: "none", sm: "flex" },
// 					marginX: ts(2),
// 				})}
// 			/>
// 			{right !== undefined ? right : <NavbarRight />}
// 		</Header>
// 	);
// };
