import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Browse from "@material-symbols/svg-400/rounded/browse-fill.svg";
import Home from "@material-symbols/svg-400/rounded/home-fill.svg";
import Person from "@material-symbols/svg-400/rounded/person-fill.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Settings from "@material-symbols/svg-400/rounded/settings.svg";
import {
	TabList,
	TabSlot,
	Tabs,
	TabTrigger,
	type TabTriggerSlotProps,
} from "expo-router/ui";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import {
	Avatar,
	FocusGroup,
	Icon,
	Menu,
	P,
	PressableFeedback,
	ts,
	useLinkTo,
} from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { cn } from "~/utils";
import KyooLongLogo from "~public/icon-long.svg";
import { AccountMenuItems } from "./navbar";

const AnimatedRail = Animated.createAnimatedComponent(FocusGroup);

export const TvTabs = () => {
	const { t } = useTranslation();
	const account = useAccount();
	const [expanded, setExpanded] = useState(false);

	return (
		<Tabs asChild>
			<View className="flex-1 flex-row bg-background">
				<TabList asChild style={{ flexDirection: "column" }}>
					<AnimatedRail
						autoFocus
						trapFocusLeft
						onFocus={() => setExpanded(true)}
						onBlur={() => setExpanded(false)}
						style={{
							width: expanded ? ts(65) : ts(18),
							transitionProperty: "width",
							transitionDuration: "250ms",
						}}
						className={cn("gap-0.5 overflow-hidden p-2")}
					>
						<View className="mb-2 h-14 justify-center overflow-hidden pl-2">
							<KyooLongLogo
								style={{ height: ts(12.5), width: (531.15 / 149) * ts(12.5) }}
							/>
						</View>
						<RailItem
							href="/browse?focus=search"
							label={t("navbar.search")}
							icon={Search}
						/>
						<TabTrigger name="index" href="/" asChild>
							<RailItem label={t("navbar.home")} icon={Home} />
						</TabTrigger>
						<TabTrigger name="browse" href="/browse" asChild>
							<RailItem label={t("navbar.browse")} icon={Browse} />
						</TabTrigger>
						<TabTrigger name="profile" href="/profile" asChild>
							<RailItem label={t("navbar.profile")} icon={Person} />
						</TabTrigger>
						{account?.isAdmin && (
							<TabTrigger name="admin" href="/admin" asChild>
								<RailItem label={t("navbar.admin")} icon={Admin} />
							</TabTrigger>
						)}
						<View className="flex-1" />
						<RailItem
							href="/settings"
							label={t("misc.settings")}
							icon={Settings}
							small
						/>
						<Menu
							Trigger={RailItem}
							label={account?.username ?? t("navbar.login")}
							left={
								<Avatar
									src={account?.logo}
									placeholder={account?.username}
									alt={t("navbar.login")}
									className="h-7 w-7"
								/>
							}
						>
							<AccountMenuItems />
						</Menu>
					</AnimatedRail>
				</TabList>
				<TabSlot style={{ flex: 1 }} />
			</View>
		</Tabs>
	);
};

const RailItem = ({
	href,
	label,
	icon,
	left,
	isFocused,
	small,
	...props
}: TabTriggerSlotProps & {
	label: string;
	icon?: Icon;
	left?: ReactNode;
	small?: boolean;
}) => {
	const link = useLinkTo({ href });

	return (
		<PressableFeedback
			{...link}
			{...props}
			className={cn(
				"group h-14 flex-row items-center overflow-hidden rounded-full",
				"highlighted:bg-accent",
				small && "h-10",
				isFocused && "bg-slate-100/10",
			)}
		>
			<View className="aspect-square h-14 items-center justify-center">
				{left ??
					(icon && (
						<Icon
							icon={icon}
							className={cn(
								"h-7 w-7 fill-slate-400 dark:fill-slate-400",
								"group-highlighted:fill-slate-200",
								small && "h-5 w-5",
								isFocused && "fill-slate-200 dark:fill-slate-200",
							)}
						/>
					))}
			</View>
			<P
				numberOfLines={1}
				className={cn(
					"flex-1 font-headers text-lg text-slate-200 dark:text-slate-200",
					small && "text-sm",
				)}
			>
				{label}
			</P>
		</PressableFeedback>
	);
};
