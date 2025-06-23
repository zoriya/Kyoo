import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import Login from "@material-symbols/svg-400/rounded/login.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Settings from "@material-symbols/svg-400/rounded/settings.svg";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import {
	Platform,
	type TextInput,
	type TextInputProps,
	View,
	type ViewProps,
} from "react-native";
import { type Theme, useYoshiki } from "yoshiki/native";
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
	ts,
} from "~/primitives";
import { useAccount, useAccounts } from "~/providers/account-context";
import { logout } from "~/ui/login/logic";
import { useQueryState } from "~/utils";
import { KyooLongLogo } from "./icon";

export const NavbarTitle = (props: { onLayout?: ViewProps["onLayout"] }) => {
	const { t } = useTranslation();

	return (
		<A
			href="/"
			aria-label={t("navbar.home")}
			{...tooltip(t("navbar.home"))}
			{...props}
		>
			<KyooLongLogo />
		</A>
	);
};

const SearchBar = ({
	ref,
	...props
}: TextInputProps & { ref?: Ref<TextInput> }) => {
	const { theme } = useYoshiki();
	const { t } = useTranslation();
	const [query, setQuery] = useQueryState("q", "");

	return (
		<Input
			ref={ref}
			value={query ?? ""}
			onChangeText={setQuery}
			placeholder={t("navbar.search")}
			placeholderTextColor={theme.contrast}
			containerStyle={{
				height: ts(4),
				flexShrink: 1,
				borderColor: (theme: Theme) => theme.contrast,
			}}
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
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const account = useAccount();
	const accounts = useAccounts();

	return (
		<Menu
			Trigger={Avatar}
			as={PressableFeedback}
			src={account?.logo}
			placeholder={account?.username}
			alt={t("navbar.login")}
			size={24}
			color={theme.colors.white}
			{...css({ margin: ts(1), justifyContent: "center" })}
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
					left={<Avatar placeholder={x.username} src={x.logo} />}
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
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const isAdmin = false; //useHasPermission(AdminPage.requiredPermissions);

	return (
		<View
			{...css({ flexDirection: "row", alignItems: "center", flexShrink: 1 })}
		>
			{Platform.OS === "web" ? (
				<SearchBar />
			) : (
				<IconButton
					icon={Search}
					color={theme.colors.white}
					as={Link}
					href={"/search"}
					{...tooltip(t("navbar.search"))}
				/>
			)}
			{isAdmin && (
				<IconButton
					icon={Admin}
					color={theme.colors.white}
					as={Link}
					href={"/admin"}
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
