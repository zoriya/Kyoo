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

/* eslint-disable react-hooks/rules-of-hooks */

import { useTranslation } from "react-i18next";
import { Platform, Pressable, View } from "react-native";
import { Theme, useYoshiki } from "yoshiki/native";
import Home from "@material-symbols/svg-400/rounded/home-fill.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import { Icon, P, ts } from "@kyoo/primitives";
import { useState } from "react";
import { motify } from "moti";

const MotiPressable = motify(Pressable)();

const MenuItem = ({
	icon,
	text,
	openned,
	setOpen,
}: {
	icon: any;
	text: string;
	openned: boolean;
	setOpen: (value: (old: number) => number) => void;
}) => {
	const { css, theme } = useYoshiki();
	const [width, setWidth] = useState(0);

	return (
		<MotiPressable
			animate={{ width }}
			onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
			{...(css(
				{
					flexDirection: "row",
					pX: ts(4),
					focus: { self: { bg: (theme: Theme) => theme.accent } },
				},
				{ onFocus: () => setOpen((x) => x++), onBlur: () => setOpen((x) => x--) },
			) as any)}
		>
			<Icon
				icon={icon}
				color={theme.colors.white}
				size={ts(4)}
				{...css({ alignSelf: "center", marginHorizontal: ts(1) })}
			/>
			{openned && <P {...css({ color: (theme) => theme.colors.white })}>{text}</P>}
		</MotiPressable>
	);
};

export const TvDrawer = ({ children }: { children: JSX.Element }) => {
	if (!Platform.isTV) return children;
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const [openned, setOpen] = useState(0);

	return (
		<View {...css({ flexDirection: "row", flexGrow: 1, bg: (theme) => theme.contrast })}>
			<View {...css({ alignSelf: "center" })}>
				<MenuItem icon={Home} text={t("navbar.home")} openned={!!openned} setOpen={setOpen} />
				<MenuItem icon={Search} text={t("navbar.search")} openned={!!openned} setOpen={setOpen} />
			</View>
			{children}
		</View>
	);
};
