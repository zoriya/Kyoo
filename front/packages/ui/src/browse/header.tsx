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

// const SortByMenu = ({
// 	sortKey,
// 	setSort,
// 	sortOrd,
// 	setSortOrd,
// 	anchor,
// 	onClose,
// }: {
// 	sortKey: SortBy;
// 	setSort: (sort: SortBy) => void;
// 	sortOrd: SortOrd;
// 	setSortOrd: (sort: SortOrd) => void;
// 	anchor: HTMLElement;
// 	onClose: () => void;
// }) => {
// 	const router = useRouter();
// 	const { t } = useTranslation("browse");

// 	return (
// 		<Menu
// 			id="sortby-menu"
// 			MenuListProps={{
// 				"aria-labelledby": "sortby",
// 			}}
// 			anchorEl={anchor}
// 			open={!!anchor}
// 			onClose={onClose}
// 		>
// 			{Object.values(SortBy).map((x) => (
// 				<MenuItem
// 					key={x}
// 					selected={sortKey === x}
// 					onClick={() => setSort(x)}
// 					component={Link}
// 					to={{ query: { ...router.query, sortBy: `${sortKey}-${sortOrd}` } }}
// 					shallow
// 					replace
// 				>
// 					<ListItemText>{t(`browse.sortkey.${x}`)}</ListItemText>
// 				</MenuItem>
// 			))}
// 			<Divider />
// 			<MenuItem
// 				selected={sortOrd === SortOrd.Asc}
// 				onClick={() => setSortOrd(SortOrd.Asc)}
// 				component={Link}
// 				to={{ query: { ...router.query, sortBy: `${sortKey}-${sortOrd}` } }}
// 				shallow
// 				replace
// 			>
// 				<ListItemIcon>
// 					<South fontSize="small" />
// 				</ListItemIcon>
// 				<ListItemText>{t("browse.sortord.asc")}</ListItemText>
// 			</MenuItem>
// 			<MenuItem
// 				selected={sortOrd === SortOrd.Desc}
// 				onClick={() => setSortOrd(SortOrd.Desc)}
// 				component={Link}
// 				to={{ query: { ...router.query, sortBy: `${sortKey}-${sortOrd}` } }}
// 				shallow
// 				replace
// 			>
// 				<ListItemIcon>
// 					<North fontSize="small" />
// 				</ListItemIcon>
// 				<ListItemText>{t("browse.sortord.desc")}</ListItemText>
// 			</MenuItem>
// 		</Menu>
// 	);
// };

// const BrowseSettings = ({
// 	sortKey,
// 	setSort,
// 	sortOrd,
// 	setSortOrd,
// 	layout,
// 	setLayout,
// }: {
// 	sortKey: SortBy;
// 	setSort: (sort: SortBy) => void;
// 	sortOrd: SortOrd;
// 	setSortOrd: (sort: SortOrd) => void;
// 	layout: Layout;
// 	setLayout: (layout: Layout) => void;
// }) => {
// 	const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
// 	const { t } = useTranslation("browse");

// 	const switchViewTitle =
// 		layout === Layout.Grid ? t("browse.switchToList") : t("browse.switchToGrid");

// 	return (
// 		<>
// 			<Box sx={{ display: "flex", justifyContent: "space-around" }}>
// 				<ButtonGroup sx={{ m: 1 }}>
// 					<Button disabled>
// 						<FilterList />
// 					</Button>
// 					<Tooltip title={t("browse.sortby-tt")}>
// 						<Button
// 							id="sortby"
// 							aria-label={t("browse.sortby-tt")}
// 							aria-controls={sortAnchor ? "sorby-menu" : undefined}
// 							aria-haspopup="true"
// 							aria-expanded={sortAnchor ? "true" : undefined}
// 							onClick={(event) => setSortAnchor(event.currentTarget)}
// 						>
// 							<Sort />
// 							{t("browse.sortby", { key: t(`browse.sortkey.${sortKey}`) })}
// 							{sortOrd === SortOrd.Asc ? <South fontSize="small" /> : <North fontSize="small" />}
// 						</Button>
// 					</Tooltip>
// 					<Tooltip title={switchViewTitle}>
// 						<Button
// 							onClick={() => setLayout(layout === Layout.List ? Layout.Grid : Layout.List)}
// 							aria-label={switchViewTitle}
// 						>
// 							{layout === Layout.List ? <GridView /> : <ViewList />}
// 						</Button>
// 					</Tooltip>
// 				</ButtonGroup>
// 			</Box>
// 			{sortAnchor && (
// 				<SortByMenu
// 					sortKey={sortKey}
// 					sortOrd={sortOrd}
// 					setSort={setSort}
// 					setSortOrd={setSortOrd}
// 					anchor={sortAnchor}
// 					onClose={() => setSortAnchor(null)}
// 				/>
// 			)}
// 		</>
// 	);
// };
