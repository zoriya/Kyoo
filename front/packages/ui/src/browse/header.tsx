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

import { HR, Icon, IconButton, Menu, P, PressableFeedback, tooltip, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { useYoshiki } from "yoshiki/native";
import GridView from "@material-symbols/svg-400/rounded/grid_view.svg";
import ViewList from "@material-symbols/svg-400/rounded/view_list.svg";
import Sort from "@material-symbols/svg-400/rounded/sort.svg";
import ArrowUpward from "@material-symbols/svg-400/rounded/arrow_upward.svg";
import ArrowDownward from "@material-symbols/svg-400/rounded/arrow_downward.svg";
import { Layout, SortBy, SortOrd } from "./types";
import { forwardRef } from "react";
import { View, PressableProps } from "react-native";

const SortTrigger = forwardRef<View, PressableProps & { sortKey: SortBy }>(function _SortTrigger(
	{ sortKey, ...props },
	ref,
) {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<PressableFeedback
			ref={ref}
			{...css({ flexDirection: "row", alignItems: "center" }, props as any)}
			{...tooltip(t("browse.sortby-tt"))}
		>
			<Icon icon={Sort} {...css({ paddingX: ts(0.5) })} />
			<P>{t(`browse.sortkey.${sortKey}`)}</P>
		</PressableFeedback>
	);
});

export const BrowseSettings = ({
	sortKey,
	sortOrd,
	setSort,
	layout,
	setLayout,
}: {
	sortKey: SortBy;
	sortOrd: SortOrd;
	setSort: (sort: SortBy, ord: SortOrd) => void;
	layout: Layout;
	setLayout: (layout: Layout) => void;
}) => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View {...css({ flexDirection: "row", marginX: ts(4), marginY: ts(1) })}>
			<View {...css({ flexGrow: 1 })}></View>
			<View {...css({ flexDirection: "row" })}>
				<Menu Trigger={SortTrigger} sortKey={sortKey}>
					{Object.values(SortBy).map((x) => (
						<Menu.Item
							key={x}
							label={t(`browse.sortkey.${x}`)}
							selected={sortKey === x}
							icon={sortOrd === SortOrd.Asc ? ArrowUpward : ArrowDownward}
							onSelect={() =>
								setSort(x, sortKey === x && sortOrd === SortOrd.Asc ? SortOrd.Desc : SortOrd.Asc)
							}
						/>
					))}
				</Menu>
				<HR orientation="vertical" />
				<IconButton
					icon={GridView}
					onPress={() => setLayout(Layout.Grid)}
					color={layout == Layout.Grid ? theme.accent : undefined}
					{...tooltip(t("browse.switchToGrid"))}
					{...css({ padding: ts(0.5), marginY: "auto" })}
				/>
				<IconButton
					icon={ViewList}
					onPress={() => setLayout(Layout.List)}
					color={layout == Layout.List ? theme.accent : undefined}
					{...tooltip(t("browse.switchToList"))}
					{...css({ padding: ts(0.5), marginY: "auto" })}
				/>
			</View>
		</View>
	);
};
