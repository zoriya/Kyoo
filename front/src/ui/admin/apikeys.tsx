import Add from "@material-symbols/svg-400/rounded/add.svg";
import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import Edit from "@material-symbols/svg-400/rounded/edit.svg";
import Key from "@material-symbols/svg-400/rounded/key.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod/v4";
import type { KyooError } from "~/models";
import {
	Button,
	Container,
	HR,
	Icon,
	IconButton,
	Input,
	Menu,
	P,
	Popup,
	PressableFeedback,
	rem,
	Skeleton,
	SubP,
	tooltip,
} from "~/primitives";
import { InfiniteFetch, type QueryIdentifier, useMutation } from "~/query";
import { cn } from "~/utils";
import { EmptyView } from "../empty-view";

const ApiKey = z
	.object({
		id: z.string(),
		name: z.string(),
		createAt: z.coerce.date(),
		lastUsed: z.coerce.date(),
		claims: z.looseObject({
			permissions: z.array(z.string()).default([]),
		}),
		kind: z.enum(["custom", "env", "lazy"]),
	})
	.transform((x) => ({
		...x,
		// env keys & unclaimed lazy keys are not stored in the database so they have zero dates
		isStored: x.createAt.getUTCFullYear() > 1,
	}));
type ApiKey = z.infer<typeof ApiKey>;

const permissions = [
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
];

const formatDate = (date: Date) => {
	return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const ApiKeyRow = ({
	apikey: { id, name, createAt, lastUsed, claims, kind, isStored },
	open,
}: {
	apikey: ApiKey;
	open: () => void;
}) => {
	const { t } = useTranslation();

	const { mutateAsync } = useMutation({
		method: "DELETE",
		path: ["auth", "keys", id],
		invalidate: ["auth", "keys"],
	});

	return (
		<PressableFeedback
			onPress={open}
			className="flex-row items-center gap-4 px-3 py-1"
		>
			<Icon icon={Key} className="h-8 w-8" />
			<View className="min-w-0 flex-1">
				<P
					numberOfLines={1}
					className="font-semibold text-slate-900 dark:text-slate-200"
				>
					{name}
				</P>
				<SubP numberOfLines={1}>{claims.permissions.join(", ")}</SubP>
			</View>
			<SubP className="hidden w-45 shrink-0 text-right md:flex">
				{isStored ? formatDate(createAt) : "-"}
			</SubP>
			<SubP className="hidden w-45 shrink-0 text-right md:flex">
				{isStored ? formatDate(lastUsed) : "-"}
			</SubP>
			{kind !== "custom" ? (
				<View
					className="h-12 w-12 items-center justify-center"
					{...tooltip(
						kind === "env"
							? t("admin.apikeys.env")
							: isStored
								? t("admin.apikeys.lazy.claimed")
								: t("admin.apikeys.lazy.unclaimed"),
					)}
				>
					<SubP>{kind === "env" ? "ENV" : "LAZY"}</SubP>
				</View>
			) : (
				<Menu Trigger={IconButton} icon={MoreVert}>
					<Menu.Item
						label={t("admin.apikeys.edit")}
						icon={Edit}
						onSelect={open}
					/>
					<Menu.Item
						label={t("admin.apikeys.delete")}
						icon={Close}
						onSelect={async () => await mutateAsync()}
					/>
				</Menu>
			)}
		</PressableFeedback>
	);
};

ApiKeyRow.Loader = () => {
	return (
		<View className="flex-row items-center gap-4 px-3 py-2">
			<Icon icon={Key} className="h-8 w-8" />
			<View className="flex-1 gap-1">
				<Skeleton className="h-4 w-1/3" />
				<Skeleton className="h-3 w-2/3" />
			</View>
			<Skeleton className="hidden h-4 w-45 md:flex" />
			<Skeleton className="hidden h-4 w-45 md:flex" />
			<Icon icon={MoreVert} />
		</View>
	);
};

const ApiKeysHeader = ({ create }: { create: () => void }) => {
	const { t } = useTranslation();

	return (
		<View className="mt-4 px-3 pt-4 pb-1">
			<Button
				icon={Add}
				text={t("admin.apikeys.create")}
				onPress={create}
				className="mb-4 self-end"
			/>
			<View className="flex-row items-center gap-4 pb-2">
				<View className="w-8" />
				<SubP className="flex-1 font-semibold uppercase">
					{t("admin.apikeys.table.name")}
				</SubP>
				<SubP className="hidden w-45 shrink-0 text-right font-semibold uppercase md:flex">
					{t("admin.apikeys.table.createdAt")}
				</SubP>
				<SubP className="hidden w-45 shrink-0 text-right font-semibold uppercase md:flex">
					{t("admin.apikeys.table.lastUsed")}
				</SubP>
				<View className="w-12" />
			</View>
			<HR />
		</View>
	);
};

const PermissionChip = ({
	permission,
	selected,
	onPress,
}: {
	permission: string;
	selected?: boolean;
	onPress?: () => void;
}) => {
	return (
		<PressableFeedback
			onPress={onPress}
			disabled={!onPress}
			className={cn(
				"flex-row items-center gap-1 rounded-4xl border border-accent px-2.5 py-0.5 outline-0",
				onPress && "highlighted:bg-accent/20",
				selected && "bg-accent highlighted:bg-accent/80",
			)}
		>
			{selected && (
				<Icon
					icon={Check}
					className="h-4 w-4 fill-slate-200 dark:fill-slate-200"
				/>
			)}
			<P
				className={cn(
					"text-sm",
					selected && "text-slate-200 dark:text-slate-200",
				)}
			>
				{permission}
			</P>
		</PressableFeedback>
	);
};

const ApiKeyPopup = ({
	apikey,
	close,
}: {
	apikey: ApiKey | null;
	close: () => void;
}) => {
	const { t } = useTranslation();
	const [name, setName] = useState(apikey?.name ?? "");
	const [selected, setSelected] = useState<string[]>(
		apikey?.claims.permissions ?? ["core.read"],
	);
	const [token, setToken] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	// env & lazy keys are defined in the env, they can't be edited
	const readonly = apikey ? apikey.kind !== "custom" : false;
	const others = Object.entries(apikey?.claims ?? {}).filter(
		([key]) => key !== "permissions",
	);

	const { mutateAsync, isPending } = useMutation({
		method: apikey ? "PATCH" : "POST",
		path: apikey ? ["auth", "keys", apikey.id] : ["auth", "keys"],
		compute: (body: { name?: string; claims: Record<string, unknown> }) => ({
			body,
		}),
		parser: z.object({ token: z.string().optional() }),
		invalidate: ["auth", "keys"],
	});
	const { mutateAsync: deleteKey, isPending: isDeleting } = useMutation({
		method: "DELETE",
		path: ["auth", "keys", apikey?.id ?? ""],
		invalidate: ["auth", "keys"],
	});

	if (token) {
		return (
			<Popup title={t("admin.apikeys.create")} icon={Key} close={close}>
				<P>{t("admin.apikeys.token")}</P>
				<Input
					value={token}
					editable={false}
					selectTextOnFocus
					containerClassName="my-1"
				/>
				<Button
					text={t("misc.close")}
					onPress={close}
					className="my-1 min-w-24 self-end"
				/>
			</Popup>
		);
	}

	return (
		<Popup
			title={apikey ? apikey.name : t("admin.apikeys.create")}
			icon={Key}
			close={close}
		>
			{readonly ? (
				<SubP>
					{apikey?.kind === "env"
						? t("admin.apikeys.env")
						: apikey?.isStored
							? t("admin.apikeys.lazy.claimed")
							: t("admin.apikeys.lazy.unclaimed")}
				</SubP>
			) : (
				<Input
					value={name}
					onChangeText={(v) => setName(v.replace(/[^a-zA-Z]/g, ""))}
					placeholder={t("admin.apikeys.name")}
					autoCapitalize="none"
					autoCorrect={false}
					autoFocus={!apikey}
					containerClassName="my-1"
				/>
			)}
			{apikey?.isStored && (
				<View className="mt-2">
					<SubP>{`${t("admin.apikeys.table.createdAt")}: ${formatDate(apikey.createAt)}`}</SubP>
					<SubP>{`${t("admin.apikeys.table.lastUsed")}: ${formatDate(apikey.lastUsed)}`}</SubP>
				</View>
			)}
			<SubP className="mt-2 mb-1">{t("admin.apikeys.permissions")}</SubP>
			<View className="flex-row flex-wrap gap-2">
				{readonly && selected.length === 0 && <P>-</P>}
				{(readonly
					? selected
					: [...new Set([...permissions, ...selected])]
				).map((x) => (
					<PermissionChip
						key={x}
						permission={x}
						selected={!readonly && selected.includes(x)}
						onPress={
							readonly
								? undefined
								: () =>
										setSelected((s) =>
											s.includes(x) ? s.filter((p) => p !== x) : [...s, x],
										)
						}
					/>
				))}
			</View>
			{others.length > 0 && (
				<>
					<SubP className="mt-4 mb-1">{t("admin.apikeys.claims")}</SubP>
					{others.map(([key, value]) => (
						<View key={key} className="flex-row flex-wrap gap-2">
							<P className="font-semibold">{key}:</P>
							<P className="shrink">{JSON.stringify(value)}</P>
						</View>
					))}
				</>
			)}
			{error && <P className="mt-2 text-red-500">{error}</P>}
			<View className="my-1 mt-4 flex-row flex-wrap justify-end gap-2">
				{apikey?.isStored && (
					<Button
						text={readonly ? t("admin.apikeys.lazy.revoke") : t("misc.delete")}
						icon={Close}
						disabled={isDeleting}
						onPress={async () => {
							setError(null);
							try {
								await deleteKey();
								close();
							} catch (e) {
								setError((e as KyooError).message);
							}
						}}
						className="min-w-24 sm:mr-auto"
					/>
				)}
				{readonly ? (
					<Button text={t("misc.close")} onPress={close} className="min-w-24" />
				) : (
					<>
						<Button
							text={t("misc.cancel")}
							onPress={close}
							className="min-w-24"
						/>
						<Button
							text={apikey ? t("misc.save") : t("admin.apikeys.create")}
							disabled={isPending || !name}
							onPress={async () => {
								setError(null);
								try {
									const ret = await mutateAsync({
										name: name !== apikey?.name ? name : undefined,
										// claims are replaced on edit, keep the ones we don't manage here
										claims: { ...apikey?.claims, permissions: selected },
									});
									if (ret.token) setToken(ret.token);
									else close();
								} catch (e) {
									setError((e as KyooError).message);
								}
							}}
							className="min-w-24"
						/>
					</>
				)}
			</View>
		</Popup>
	);
};

export const AdminApiKeysPage = () => {
	const { t } = useTranslation();
	const [popup, setPopup] = useState<ApiKey | "create" | null>(null);
	const close = () => setPopup(null);

	return (
		<>
			<InfiniteFetch
				query={AdminApiKeysPage.query()}
				layout={{
					layout: "vertical",
					numColumns: 1,
					size: rem(19),
					gap: 8,
				}}
				Header={
					<View>
						<Container>
							<ApiKeysHeader create={() => setPopup("create")} />
						</Container>
					</View>
				}
				Render={({ item }) => (
					<Container>
						<ApiKeyRow apikey={item} open={() => setPopup(item)} />
					</Container>
				)}
				Loader={() => (
					<Container>
						<ApiKeyRow.Loader />
					</Container>
				)}
				Divider={() => (
					<Container>
						<HR />
					</Container>
				)}
				Empty={<EmptyView message={t("admin.apikeys.empty")} />}
			/>
			{popup && (
				<ApiKeyPopup apikey={popup === "create" ? null : popup} close={close} />
			)}
		</>
	);
};

AdminApiKeysPage.query = (): QueryIdentifier<ApiKey> => ({
	parser: ApiKey,
	path: ["auth", "keys"],
	infinite: true,
});
