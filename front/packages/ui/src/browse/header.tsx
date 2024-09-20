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
import ArrowDownward from "@material-symbols/svg-400/rounded/arrow_downward.svg";
import ArrowUpward from "@material-symbols/svg-400/rounded/arrow_upward.svg";
import FilterList from "@material-symbols/svg-400/rounded/filter_list.svg";
import GridView from "@material-symbols/svg-400/rounded/grid_view.svg";
import Sort from "@material-symbols/svg-400/rounded/sort.svg";
import ViewList from "@material-symbols/svg-400/rounded/view_list.svg";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { Layout, type MediaType, MediaTypeAll, SearchSort, SortOrd } from "./types";

const SortTrigger = forwardRef<View, PressableProps & { sortKey: string }>(function SortTrigger(
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
			<P>{t(`browse.sortkey.${sortKey}` as any)}</P>
		</PressableFeedback>
	);
});

const MediaTypeTrigger = forwardRef<View, PressableProps & { mediaType: MediaType }>(
	function MediaTypeTrigger({ mediaType, ...props }, ref) {
		const { css } = useYoshiki();
		const { t } = useTranslation();
		const labelKey =
			mediaType !== MediaTypeAll ? `browse.mediatypekey.${mediaType.key}` : "browse.mediatypelabel";
		const icon = mediaType !== MediaTypeAll ? (mediaType?.icon ?? FilterList) : FilterList;
		return (
			<PressableFeedback
				ref={ref}
				{...css({ flexDirection: "row", alignItems: "center" }, props as any)}
				{...tooltip(t("browse.mediatype-tt"))}
			>
				<Icon icon={icon} {...css({ paddingX: ts(0.5) })} />
				<P>{t(labelKey as any)}</P>
			</PressableFeedback>
		);
	},
);

export const BrowseSettings = ({
	availableSorts,
	sortKey,
	sortOrd,
	setSort,
	availableMediaTypes,
	mediaType,
	setMediaType,
	layout,
	setLayout,
}: {
	availableSorts: string[];
	sortKey: string;
	sortOrd: SortOrd;
	setSort: (sort: string, ord: SortOrd) => void;
	availableMediaTypes: MediaType[];
	mediaType: MediaType;
	setMediaType: (mediaType: MediaType) => void;
	layout: Layout;
	setLayout: (layout: Layout) => void;
}) => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View
			{...css({
				flexDirection: "row-reverse",
				alignItems: "center",
				marginX: ts(4),
				marginY: ts(1),
			})}
		>
			<View {...css({ flexDirection: "row" })}>
				<Menu Trigger={SortTrigger} sortKey={sortKey}>
					{availableSorts.map((x) => (
						<Menu.Item
							key={x}
							label={t(`browse.sortkey.${x}` as any)}
							selected={sortKey === x}
							icon={
								x !== SearchSort.Relevance
									? sortOrd === SortOrd.Asc
										? ArrowUpward
										: ArrowDownward
									: undefined
							}
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
					color={layout === Layout.Grid ? theme.accent : undefined}
					{...tooltip(t("browse.switchToGrid"))}
					{...css({ padding: ts(0.5), marginY: "auto" })}
				/>
				<IconButton
					icon={ViewList}
					onPress={() => setLayout(Layout.List)}
					color={layout === Layout.List ? theme.accent : undefined}
					{...tooltip(t("browse.switchToList"))}
					{...css({ padding: ts(0.5), marginY: "auto" })}
				/>
			</View>
			<View {...css({ flexGrow: 1, flexDirection: "row", alignItems: "center" })}>
				<Menu Trigger={MediaTypeTrigger} mediaType={mediaType}>
					{availableMediaTypes.map((x) => (
						<Menu.Item
							key={x.key}
							label={t(`browse.mediatypekey.${x.key}` as any)}
							selected={mediaType === x}
							icon={x.icon}
							onSelect={() => setMediaType(x)}
						/>
					))}
				</Menu>
			</View>
		</View>
	);
};
