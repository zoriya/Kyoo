import { Children, Fragment, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";
import { useMutation } from "~/data";
import { User } from "~/models";
import { Container, FocusGroup, H1, HR, Icon, P, SubP } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import type { Falsy } from "~/utils";

export const Preference = ({
	customIcon,
	icon,
	label,
	description,
	children,
	...props
}: {
	customIcon?: ReactElement | Falsy;
	icon: Icon;
	label: string | ReactElement;
	description: string | ReactElement;
	children?: ReactNode;
}) => {
	return (
		<View
			className="m-2 flex-1 flex-row items-center justify-between"
			{...props}
		>
			<View className="mx-4 shrink flex-row items-center gap-4">
				{customIcon ?? <Icon icon={icon} />}
				<View className="shrink">
					<P>{label}</P>
					<SubP>{description}</SubP>
				</View>
			</View>
			<View className="mx-4 max-w-1/2 flex-row flex-wrap justify-end gap-2">
				{children}
			</View>
		</View>
	);
};

export const SettingsContainer = ({
	children,
	title,
	extra,
	extraTop,
	...props
}: {
	children: ReactNode;
	title: string;
	extra?: ReactNode;
	extraTop?: ReactNode;
}) => {
	return (
		<Container {...props}>
			<H1 className="my-2 text-4xl">{title}</H1>
			{extraTop}
			<View className="rounded bg-card">
				{Children.toArray(children)
					.filter((x) => x)
					.map((x, i) => (
						<Fragment key={i}>
							{i !== 0 && <HR className="my-2" />}
							<FocusGroup trapFocusLeft trapFocusRight scrollSnapAlign="center">
								{x}
							</FocusGroup>
						</Fragment>
					))}
			</View>
			{extra && (
				<FocusGroup trapFocusLeft trapFocusRight scrollSnapAlign="center">
					{extra}
				</FocusGroup>
			)}
		</Container>
	);
};

export const useSetting = <Setting extends keyof User["claims"]["settings"]>(
	setting: Setting,
) => {
	const account = useAccount();
	const { mutate } = useMutation(
		(update: Partial<User["claims"]["settings"]>) => ({
			method: "PATCH",
			path: ["auth", "users", "me"],
			body: {
				claims: {
					settings: { ...account!.claims.settings, ...update },
				},
			},
			schema: User,
			optimistic: () => ({
				id: account!.id,
				claims: {
					...account!.claims,
					settings: { ...account!.claims.settings, ...update },
				},
			}),
		}),
	);

	if (!account) return null;
	return [
		account.claims.settings[setting],
		async (value: User["claims"]["settings"][Setting]) =>
			await mutate({ [setting]: value }),
	] as const;
};
