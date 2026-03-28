import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { User } from "~/models";
import { AuthInfo } from "~/models/auth-info";
import {
	Avatar,
	Container,
	HR,
	Icon,
	IconButton,
	Link,
	Menu,
	P,
	Skeleton,
	SubP,
	tooltip,
} from "~/primitives";
import {
	InfiniteFetch,
	type QueryIdentifier,
	useFetch,
	useMutation,
} from "~/query";
import { cn } from "~/utils";

const formatLastSeen = (date: Date) => {
	return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const UserRow = ({
	id,
	logo,
	username,
	lastSeen,
	oidc,
	oidcInfo,
	isVerified,
	isAdmin,
}: {
	id: string;
	logo: string;
	username: string;
	lastSeen: Date;
	oidc: User["oidc"];
	oidcInfo?: AuthInfo["oidc"];
	isVerified: boolean;
	isAdmin: boolean;
}) => {
	const { t } = useTranslation();
	const oidcProviders = Object.keys(oidc);

	const { mutateAsync } = useMutation({
		path: ["auth", "users", id],
		compute: (action: "verify" | "admin" | "delete") => ({
			method: action === "delete" ? "DELETE" : "PATCH",
			body: {
				claims:
					action === "verify"
						? { verified: true }
						: {
								permissions: [
									"users.read",
									"users.write",
									"users.delete",
									"apikeys.read",
									"apikeys.write",
									"core.read",
									"core.write",
									"core.play",
									"scanner.trigger",
									"scanner.guess",
									"scanner.search",
									"scanner.add",
								],
							},
			},
		}),
		invalidate: ["auth", "users"],
	});

	return (
		<Link
			href={`/profiles/${username}`}
			className="flex-row items-center gap-4 px-3"
		>
			<Avatar src={logo} placeholder={username} className="h-8 w-8" />
			<View className="min-w-0 flex-1">
				<P
					numberOfLines={1}
					className="font-semibold text-slate-900 dark:text-slate-200"
				>
					{username}
				</P>
				<SubP className="sm:hidden">{formatLastSeen(lastSeen)}</SubP>
			</View>
			<SubP className="hidden w-45 shrink-0 text-right sm:flex">
				{formatLastSeen(lastSeen)}
			</SubP>
			<View className="w-20 shrink-0 flex-row justify-end gap-1">
				{oidcProviders.length === 0 ? (
					<SubP>-</SubP>
				) : (
					oidcProviders.map((provider) => (
						<Avatar
							key={provider}
							src={oidcInfo?.[provider]?.logo ?? undefined}
							placeholder={provider}
							{...tooltip(oidcInfo?.[provider]?.name ?? provider)}
						/>
					))
				)}
			</View>
			<Icon
				icon={isAdmin ? Admin : isVerified ? Check : Close}
				className={cn(
					"fill-amber-500 dark:fill-amber-500",
					isVerified && "fill-emerald-500 dark:fill-emerald-500",
					isAdmin && "fill-accent dark:fill-accent",
				)}
				{...tooltip(
					t(
						isAdmin
							? "admin.users.adminUser"
							: isVerified
								? "admin.users.regularUser"
								: "admin.users.unverifed",
					),
				)}
			/>
			<Menu Trigger={IconButton} icon={MoreVert}>
				{!isVerified && (
					<Menu.Item
						label={t("admin.users.verify")}
						icon={Check}
						onSelect={async () => await mutateAsync("verify")}
					/>
				)}
				<Menu.Item
					label={t("admin.users.set-permissions")}
					icon={Admin}
					onSelect={async () => await mutateAsync("admin")}
				/>
				<HR />
				<Menu.Item
					label={t("admin.users.delete")}
					icon={Close}
					onSelect={async () => await mutateAsync("delete")}
				/>
			</Menu>
		</Link>
	);
};

UserRow.Loader = () => {
	return (
		<View className="flex-row items-center gap-4 px-3 py-2">
			<Avatar.Loader className="h-8 w-8" />
			<Skeleton className="h-4 flex-1" />
			<Skeleton className="hidden h-4 w-50 sm:flex" />
			<View className="w-20 flex-row gap-1">
				<Avatar.Loader />
				<Avatar.Loader />
			</View>
			<Skeleton className="h-6 w-6" />
			<Icon icon={MoreVert} />
		</View>
	);
};

const UsersHeader = () => {
	const { t } = useTranslation();

	return (
		<View className="mt-4 px-3 pt-4 pb-1">
			<View className="flex-row items-center gap-4 pb-2">
				<View className="w-8" />
				<SubP className="flex-1 font-semibold uppercase">
					{t("admin.users.table.username")}
				</SubP>
				<SubP className="hidden w-40 shrink-0 text-right font-semibold uppercase sm:flex">
					{t("admin.users.table.lastSeen")}
				</SubP>
				<SubP className="w-20 shrink-0 text-right font-semibold uppercase">
					{t("admin.users.table.oidc")}
				</SubP>
				<View className="w-22" />
			</View>
			<HR />
		</View>
	);
};

export const AdminUsersPage = () => {
	const { data } = useFetch(AdminUsersPage.authQuery());

	return (
		<InfiniteFetch
			query={AdminUsersPage.query()}
			layout={{
				layout: "vertical",
				numColumns: 1,
				size: 76,
				gap: 8,
			}}
			Header={
				<View>
					<Container>
						<UsersHeader />
					</Container>
				</View>
			}
			Render={({ item }) => (
				<Container>
					<UserRow
						{...item}
						oidcInfo={data?.oidc}
						isVerified={item.claims.verified}
					/>
				</Container>
			)}
			Loader={() => (
				<Container>
					<UserRow.Loader />
				</Container>
			)}
			Divider={() => (
				<Container>
					<HR />
				</Container>
			)}
		/>
	);
};

AdminUsersPage.query = (): QueryIdentifier<User> => ({
	parser: User,
	path: ["auth", "users"],
	infinite: true,
});

AdminUsersPage.authQuery = (): QueryIdentifier<AuthInfo> => ({
	parser: AuthInfo,
	path: ["auth", "info"],
});
