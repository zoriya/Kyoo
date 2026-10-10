import Add from "@material-symbols/svg-400/rounded/add.svg";
import { useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import {
	Alert,
	Avatar,
	FocusGroup,
	H1,
	Icon,
	P,
	PressableFeedback,
	SubP,
} from "~/primitives";
import { useAccounts } from "~/providers/account-context";
import { cn } from "~/utils";
import { getDisplayUrl } from "../navbar";
import { logout } from "./logic";

export const AccountsPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const accounts = useAccounts();

	return (
		<View className="flex-1 items-center justify-center bg-background">
			<H1 className="mb-12 text-center">{t("login.switch.title")}</H1>
			<ScrollView horizontal className="max-h-80 grow-0">
				<FocusGroup autoFocus className="flex-row gap-8 px-12 py-4">
					{accounts.map((x) => (
						<AccountTile
							key={x.id}
							label={x.username}
							description={getDisplayUrl(x.apiUrl)}
							selected={x.selected}
							hasTVPreferredFocus={x.selected}
							onPress={() => {
								x.select();
								router.replace("/");
							}}
							onLongPress={() => {
								Alert.alert(
									t("login.logout"),
									t("login.switch.logout-confirmation", {
										username: x.username,
									}),
									[
										{ text: t("misc.cancel"), style: "cancel" },
										{
											text: t("login.logout"),
											onPress: () => logout(x.id),
											style: "destructive",
										},
									],
									{ cancelable: true },
								);
							}}
						>
							<Avatar
								src={x.logo}
								placeholder={x.username}
								alt={x.username}
								className="h-full w-full justify-center"
								placeholderClassName="font-headers text-6xl"
							/>
						</AccountTile>
					))}
					<AccountTile
						label={t("login.add-account")}
						hasTVPreferredFocus={accounts.length === 0}
						onPress={() => {
							const current = accounts.find((x) => x.selected)?.apiUrl;
							router.push(
								current
									? `/login?serverUrl=${encodeURIComponent(current)}`
									: "/login",
							);
						}}
					>
						<View className="h-full w-full items-center justify-center bg-slate-300 dark:bg-slate-700">
							<Icon icon={Add} className="h-16 w-16" />
						</View>
					</AccountTile>
				</FocusGroup>
			</ScrollView>
			{accounts.length > 0 && (
				<SubP className="mt-8 text-center">{t("login.switch.hint")}</SubP>
			)}
		</View>
	);
};

const AccountTile = ({
	label,
	description,
	selected,
	children,
	...props
}: {
	label: string;
	description?: string;
	selected?: boolean;
	hasTVPreferredFocus?: boolean;
	onPress: () => void;
	onLongPress?: () => void;
	children: ReactNode;
}) => {
	const [focused, setFocused] = useState(false);

	return (
		<View className="w-40 items-center">
			<PressableFeedback
				{...props}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				className={cn(
					"h-40 w-40 overflow-hidden rounded-full",
					selected && "ring-2 ring-slate-400",
					"highlighted:scale-110 highlighted:ring-4 highlighted:ring-accent",
				)}
			>
				{children}
			</PressableFeedback>
			<P
				numberOfLines={1}
				className={cn("mt-4 font-headers text-xl", focused && "text-accent")}
			>
				{label}
			</P>
			{description && (
				<SubP numberOfLines={1} className="text-center">
					{description}
				</SubP>
			)}
		</View>
	);
};
