import { Children, Fragment, type ReactElement, type ReactNode } from "react";
import { type Falsy, View } from "react-native";
import type { User } from "~/models";
import { Container, H1, HR, Icon, P, SubP } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useMutation } from "~/query";

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
	children: ReactElement | (ReactElement | Falsy)[] | Falsy;
	title: string;
	extra?: ReactElement;
	extraTop?: ReactElement;
}) => {
	return (
		<Container {...props}>
			<H1 className="my-2 text-4xl">{title}</H1>
			{extraTop}
			<View className="rounded bg-card">
				{Children.map(children, (x, i) => (
					<Fragment key={i}>
						{i !== 0 && <HR className="my-2" />}
						{x}
					</Fragment>
				))}
			</View>
			{extra}
		</Container>
	);
};

export const useSetting = <Setting extends keyof User["claims"]["settings"]>(
	setting: Setting,
) => {
	const account = useAccount();
	const { mutateAsync } = useMutation({
		method: "PATCH",
		path: ["auth", "users", "me"],
		compute: (update: Partial<User["claims"]["settings"]>) => ({
			body: {
				claims: {
					settings: { ...account!.claims.settings, ...update },
				},
			},
		}),
		optimistic: (update) => ({
			...account,
			claims: {
				...account!.claims,
				settings: { ...account!.claims.settings, ...update },
			},
		}),
		invalidate: ["auth", "users", "me"],
	});

	if (!account) return null;
	return [
		account.claims.settings[setting],
		async (value: User["claims"]["settings"][Setting]) => {
			await mutateAsync({ [setting]: value });
		},
	] as const;
};
