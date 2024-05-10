/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { type User, queryFn, useAccount } from "@kyoo/models";
import {
	Container,
	H1,
	HR,
	Icon,
	P,
	SubP,
	SwitchVariant,
	imageBorderRadius,
	ts,
} from "@kyoo/primitives";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Children, type ReactElement, type ReactNode } from "react";
import { type Falsy, View } from "react-native";
import { px, rem, useYoshiki } from "yoshiki/native";

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
					<P {...css({ marginBottom: 0 })}>{label}</P>
					<SubP>{description}</SubP>
				</View>
			</View>
			<View {...css({ marginX: ts(2), flexDirection: "row", gap: ts(1) })}>{children}</View>
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
							borderRadius: px(imageBorderRadius),
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

export const useSetting = <Setting extends keyof User["settings"]>(setting: Setting) => {
	const account = useAccount();

	const queryClient = useQueryClient();
	const { mutateAsync } = useMutation({
		mutationFn: async (update: Partial<User["settings"]>) =>
			await queryFn({
				path: ["auth", "me"],
				method: "PATCH",
				body: { settings: { ...account!.settings, ...update } },
			}),
		onMutate: async (newSettings) => {
			const next = { ...account!, settings: { ...account!.settings, ...newSettings } };
			await queryClient.cancelQueries({ queryKey: ["auth", "me"] });
			const previous = queryClient.getQueryData(["auth", "me"]);
			queryClient.setQueryData(["auth", "me"], next);
			return { previous, next };
		},
		onError: (_, __, context) => {
			queryClient.setQueryData(["auth", "me"], context!.previous);
		},
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
	});

	if (!account) return null;
	return [
		account.settings[setting],
		async (value: User["settings"][Setting]) => {
			await mutateAsync({ [setting]: value });
		},
	] as const;
};
