import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Browse from "@material-symbols/svg-400/rounded/browse-fill.svg";
import Home from "@material-symbols/svg-400/rounded/home-fill.svg";
import Person from "@material-symbols/svg-400/rounded/person-fill.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Settings from "@material-symbols/svg-400/rounded/settings.svg";
import { usePathname } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import {
	Avatar,
	FocusGroup,
	Icon,
	Link,
	Menu,
	P,
	PressableFeedback,
} from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { cn } from "~/utils";
import KyooLogo from "~public/icon.svg";
import { AccountMenuItems } from "./navbar";

// Collapsed the rail is a column of icons, and it slides open over the content
// (instead of pushing it) as soon as the dpad enters it, the way every leanback
// launcher does it.
const collapsedWidth = 72;
const expandedWidth = 260;

const RailItem = ({
	href,
	label,
	icon,
	left,
	expanded,
	selected = false,
	...props
}: {
	// a row that goes somewhere is a link, one that opens a menu is a button
	href?: string;
	label: string;
	icon?: ComponentProps<typeof Icon>["icon"];
	// stands in for the icon: the account row wears its avatar there
	left?: (highlighted: true | undefined) => ReactNode;
	expanded: boolean;
	selected?: boolean;
} & PressableProps) => {
	const Container = href !== undefined ? Link : PressableFeedback;
	return (
		<Container
			href={href!}
			aria-label={label}
			{...props}
			// no ring here: the whole row turning solid accent reads better than an
			// outline on something this wide.
			className={cn(
				"h-14 flex-row items-center overflow-hidden rounded-full outline-0",
				"highlighted:bg-accent",
				selected && "bg-slate-100/10",
			)}
			style={{ width: expandedWidth - 16 }}
		>
			{({ focused, hovered }: { focused?: boolean; hovered?: boolean }) => (
				<>
					<View
						className="items-center justify-center"
						style={{ width: collapsedWidth - 16 }}
					>
						{left?.(focused || hovered || undefined)}
						{icon && (
							<Icon
								icon={icon}
								data-highlighted={focused || hovered || undefined}
								className={cn(
									"h-7 w-7 fill-slate-400 dark:fill-slate-400",
									"data-highlighted:fill-slate-200",
									selected && "fill-slate-200 dark:fill-slate-200",
								)}
							/>
						)}
					</View>
					{/* kept mounted while collapsed so opening the rail does not relayout
					    the row, it only reveals what the clip was already hiding. */}
					<P
						numberOfLines={1}
						className={cn(
							"font-headers text-lg text-slate-200 uppercase dark:text-slate-200",
							"transition-opacity duration-150",
							!expanded && "opacity-0",
						)}
					>
						{label}
					</P>
				</>
			)}
		</Container>
	);
};

// The avatar and everything you can do about the account behind it, in the
// shape of a rail row. Same menu as the one the phone hangs off its header.
const RailAccount = ({ expanded }: { expanded: boolean }) => {
	const { t } = useTranslation();
	const account = useAccount();

	return (
		<Menu
			Trigger={RailItem}
			label={account?.username ?? t("navbar.login")}
			expanded={expanded}
			left={() => (
				<Avatar
					src={account?.logo}
					placeholder={account?.username}
					alt={t("navbar.login")}
					className="h-7 w-7"
				/>
			)}
		>
			<AccountMenuItems />
		</Menu>
	);
};

export const TvNavRail = ({ children }: { children: ReactNode }) => {
	const { t } = useTranslation();
	const account = useAccount();
	const path = usePathname();
	const [expanded, setExpanded] = useState(false);

	return (
		<View className="flex-1 flex-row bg-background">
			{/* the rail is absolute so expanding it never reflows the page under it */}
			<View style={{ width: collapsedWidth }} />
			<FocusGroup
				autoFocus
				// left of the leftmost item is the screen edge, without this the focus
				// engine happily jumps back into the content on the other side.
				trapFocusLeft
				onFocus={() => setExpanded(true)}
				onBlur={() => setExpanded(false)}
				className={cn(
					"absolute top-0 bottom-0 left-0 z-20 gap-1 p-2",
					"overflow-hidden transition-all duration-150",
					expanded ? "bg-slate-950/95" : "bg-transparent",
				)}
				style={{ width: expanded ? expandedWidth : collapsedWidth }}
			>
				{/* A rail is read top to bottom: the mark, then where you can go, then
				    the things about you rather than about the library. */}
				<View
					className="mb-6 items-center"
					style={{ width: collapsedWidth - 16 }}
				>
					{/* the file is painted with `currentColor` on native (see .svgrrc), and
					    the rail is dark whatever the theme is. */}
					<KyooLogo
						color="#f0f2f5"
						style={{ width: 40, aspectRatio: "289.35/296.15" }}
					/>
				</View>
				<View className="flex-1 justify-center gap-1">
					<RailItem
						href="/browse?focus=search"
						label={t("navbar.search")}
						icon={Search}
						expanded={expanded}
						selected={false}
					/>
					<RailItem
						href="/"
						label={t("navbar.home")}
						icon={Home}
						expanded={expanded}
						selected={path === "/"}
					/>
					<RailItem
						href="/browse"
						label={t("navbar.browse")}
						icon={Browse}
						expanded={expanded}
						selected={path === "/browse"}
					/>
					<RailItem
						href="/profiles/me"
						label={t("navbar.profile")}
						icon={Person}
						expanded={expanded}
						selected={path.startsWith("/profiles")}
					/>
					{account?.isAdmin && (
						<RailItem
							href="/admin/unmatched"
							label={t("navbar.admin")}
							icon={Admin}
							expanded={expanded}
							selected={path.startsWith("/admin")}
						/>
					)}
				</View>
				<View className="gap-1">
					<RailAccount expanded={expanded} />
					<RailItem
						href="/settings"
						label={t("misc.settings")}
						icon={Settings}
						expanded={expanded}
						selected={path === "/settings"}
					/>
				</View>
			</FocusGroup>
			{/* no focus group around the content: `autoFocus` on a container this big
			    intercepts every focus move that bubbles up to it and bounces it back to
			    the child it remembers, which eats one dpad press out of two. */}
			<View className="flex-1">{children}</View>
		</View>
	);
};
