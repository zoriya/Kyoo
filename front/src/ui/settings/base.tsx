import { Children, type ReactElement, type ReactNode } from "react";
import { type Falsy, View } from "react-native";
import { percent, px, rem, useYoshiki } from "yoshiki/native";
import type { User } from "~/models";
import {
	Container,
	H1,
	HR,
	Icon,
	P,
	SubP,
	SwitchVariant,
	ts,
} from "~/primitives";
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
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					margin: ts(1),
					flexGrow: 1,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				},
				props,
			)}
		>
			<View
				{...css({
					flexDirection: "row",
					alignItems: "center",
					flexShrink: 1,
					marginX: ts(2),
					gap: ts(2),
				})}
			>
				{customIcon ?? <Icon icon={icon} />}
				<View {...css({ flexShrink: 1 })}>
					<P {...(css({ marginBottom: 0 }) as any)}>{label}</P>
					<SubP>{description}</SubP>
				</View>
			</View>
			<View
				{...css({
					marginX: ts(2),
					flexDirection: "row",
					justifyContent: "flex-end",
					gap: ts(1),
					maxWidth: percent(50),
					flexWrap: "wrap",
				})}
			>
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
	const { css } = useYoshiki();

	return (
		<Container {...props}>
			<H1 {...css({ fontSize: rem(2) })}>{title}</H1>
			{extraTop}
			<SwitchVariant>
				{({ css }) => (
					<View
						{...css({
							bg: (theme) => theme.background,
							borderRadius: px(6),
						})}
					>
						{Children.map(children, (x, i) => (
							<>
								{i !== 0 && <HR {...css({ marginY: ts(1) })} />}
								{x}
							</>
						))}
					</View>
				)}
			</SwitchVariant>
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
					...account!.claims,
					settings: { ...account!.claims.settings, ...update },
				},
			},
		}),
		optimistic: (update) => ({
			body: {
				...account,
				claims: {
					...account!.claims,
					settings: { ...account!.claims.settings, ...update },
				},
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
