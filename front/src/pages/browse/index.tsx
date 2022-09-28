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

import { FilterList, GridView, North, Sort, South, ViewList } from "@mui/icons-material";
import {
	Box,
	Button,
	ButtonGroup,
	ListItemIcon,
	ListItemText,
	MenuItem,
	Menu,
	Skeleton,
	Divider,
	Tooltip,
	Typography,
} from "@mui/material";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { MouseEvent, useState } from "react";
import { ErrorPage } from "~/components/errors";
import { Navbar } from "~/components/navbar";
import { Poster, Image } from "~/components/poster";
import { ItemType, LibraryItem, LibraryItemP } from "~/models";
import { getDisplayDate } from "~/models/utils";
import { InfiniteScroll } from "~/utils/infinite-scroll";
import { Link } from "~/utils/link";
import { withRoute } from "~/utils/router";
import { QueryIdentifier, QueryPage, useInfiniteFetch } from "~/utils/query";

enum SortBy {
	Name = "name",
	StartAir = "startAir",
	EndAir = "endAir",
}

enum SortOrd {
	Asc = "asc",
	Desc = "desc",
}

enum Layout {
	Grid,
	List,
}

const ItemGrid = ({
	href,
	name,
	subtitle,
	poster,
	loading,
}: {
	href?: string;
	name?: string;
	subtitle?: string | null;
	poster?: string | null;
	loading?: boolean;
}) => {
	return (
		<Link
			href={href ?? ""}
			color="inherit"
			sx={{
				display: "flex",
				alignItems: "center",
				textAlign: "center",
				width: ["18%", "25%"],
				minWidth: ["90px", "120px"],
				maxWidth: "168px",
				flexDirection: "column",
				m: [1, 2],
			}}
		>
			<Poster img={poster} alt={name} width="100%" />
			<Typography minWidth="80%">{name ?? <Skeleton />}</Typography>
			{(loading || subtitle) && (
				<Typography variant="caption" minWidth="50%">
					{subtitle ?? <Skeleton />}
				</Typography>
			)}
		</Link>
	);
};

const ItemList = ({
	href,
	name,
	subtitle,
	thumbnail,
	poster,
	loading,
}: {
	href?: string;
	name?: string;
	subtitle?: string | null;
	poster?: string | null;
	thumbnail?: string | null;
	loading?: boolean;
}) => {
	return (
		<Link
			href={href ?? ""}
			color="inherit"
			sx={{
				display: "flex",
				textAlign: "center",
				alignItems: "center",
				justifyContent: "space-evenly",
				width: "100%",
				height: "300px",
				flexDirection: "row",
				m: 1,
				position: "relative",
				color: "white",
				"&:hover .poster": {
					transform: "scale(1.3)",
				},
			}}
		>
			<Image
				img={thumbnail}
				alt={name}
				width="100%"
				height="100%"
				radius="5px"
				sx={{
					position: "absolute",
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					zIndex: -1,

					"&::after": {
						content: '""',
						position: "absolute",
						top: 0,
						bottom: 0,
						right: 0,
						left: 0,
						/* background: "rgba(0, 0, 0, 0.4)", */
						background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0.6) 100%)",
					},
				}}
			/>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					width: { xs: "50%", lg: "30%" },
				}}
			>
				<Typography
					variant="button"
					sx={{
						fontSize: "2rem",
						letterSpacing: "0.002rem",
						fontWeight: 900,
					}}
				>
					{name ?? <Skeleton />}
				</Typography>
				{(loading || subtitle) && (
					<Typography variant="caption" sx={{ fontSize: "1rem" }}>
						{subtitle ?? <Skeleton />}
					</Typography>
				)}
			</Box>
			<Poster
				img={poster}
				alt=""
				height="80%"
				className="poster"
				sx={{
					transition: "transform .2s",
				}}
			/>
		</Link>
	);
};

const Item = ({ item, layout }: { item?: LibraryItem; layout: Layout }) => {
	let href;
	if (item?.type === ItemType.Movie) href = `/movie/${item.slug}`;
	else if (item?.type === ItemType.Show) href = `/show/${item.slug}`;
	else if (item?.type === ItemType.Collection) href = `/collection/${item.slug}`;

	switch (layout) {
		case Layout.Grid:
			return (
				<ItemGrid
					href={href}
					name={item?.name}
					subtitle={item && item.type !== ItemType.Collection ? getDisplayDate(item) : null}
					poster={item?.poster}
					loading={!item}
				/>
			);
		case Layout.List:
			return (
				<ItemList
					href={href}
					name={item?.name}
					subtitle={item && item.type !== ItemType.Collection ? getDisplayDate(item) : null}
					poster={item?.poster}
					thumbnail={item?.thumbnail}
					loading={!item}
				/>
			);
	}
};

const BrowseSettings = ({
	sortKey,
	setSort,
	sortOrd,
	setSortOrd,
	layout,
	setLayout,
}: {
	sortKey: SortBy;
	setSort: (sort: SortBy) => void;
	sortOrd: SortOrd;
	setSortOrd: (sort: SortOrd) => void;
	layout: Layout;
	setLayout: (layout: Layout) => void;
}) => {
	const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
	const router = useRouter();
	const { t } = useTranslation("browse");

	const switchViewTitle = layout === Layout.Grid 
		? t("browse.switchToList")
		: t("browse.switchToGrid");

	return (
		<>
			<Box sx={{ display: "flex", justifyContent: "space-around" }}>
				<ButtonGroup sx={{ m: 1 }}>
					<Button disabled>
						<FilterList />
					</Button>
					<Tooltip title={t("browse.sortby-tt")}>
						<Button
							id="sortby"
							aria-label={t("browse.sortby-tt")}
							aria-controls={sortAnchor ? "sorby-menu" : undefined}
							aria-haspopup="true"
							aria-expanded={sortAnchor ? "true" : undefined}
							onClick={(event: MouseEvent<HTMLElement>) => setSortAnchor(event.currentTarget)}
						>
							<Sort />
							{t("browse.sortby", { key: t(`browse.sortkey.${sortKey}`) })}
							{sortOrd === SortOrd.Asc ? <South fontSize="small" /> : <North fontSize="small" />}
						</Button>
					</Tooltip>
					<Tooltip title={switchViewTitle}>
						<Button
							onClick={() => setLayout(layout === Layout.List ? Layout.Grid : Layout.List)}
							aria-label={switchViewTitle}
						>
							{layout === Layout.List ? <GridView /> : <ViewList />}
						</Button>
					</Tooltip>
				</ButtonGroup>
			</Box>
			<Menu
				id="sortby-menu"
				MenuListProps={{
					"aria-labelledby": "sortby",
				}}
				anchorEl={sortAnchor}
				open={!!sortAnchor}
				onClose={() => setSortAnchor(null)}
			>
				{Object.values(SortBy).map((x) => (
					<MenuItem
						key={x}
						selected={sortKey === x}
						onClick={() => setSort(x)}
						component={Link}
						to={{ query: { ...router.query, sortBy: `${sortKey}-${sortOrd}` } }}
						shallow
						replace
					>
						<ListItemText>{t(`browse.sortkey.${x}`)}</ListItemText>
					</MenuItem>
				))}
				<Divider />
				<MenuItem
					selected={sortOrd === SortOrd.Asc}
					onClick={() => setSortOrd(SortOrd.Asc)}
					component={Link}
					to={{ query: { ...router.query, sortBy: `${sortKey}-${sortOrd}` } }}
					shallow
					replace
				>
					<ListItemIcon>
						<South fontSize="small" />
					</ListItemIcon>
					<ListItemText>{t("browse.sortord.asc")}</ListItemText>
				</MenuItem>
				<MenuItem
					selected={sortOrd === SortOrd.Desc}
					onClick={() => setSortOrd(SortOrd.Desc)}
					component={Link}
					to={{ query: { ...router.query, sortBy: `${sortKey}-${sortOrd}` } }}
					shallow
					replace
				>
					<ListItemIcon>
						<North fontSize="small" />
					</ListItemIcon>
					<ListItemText>{t("browse.sortord.desc")}</ListItemText>
				</MenuItem>
			</Menu>
		</>
	);
};

const query = (
	slug?: string,
	sortKey?: SortBy,
	sortOrd?: SortOrd,
): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: slug ? ["library", slug, "items"] : ["items"],
	infinite: true,
	params: {
		// The API still uses title isntead of name
		sortBy: sortKey
			? `${sortKey === SortBy.Name ? "title" : sortKey}:${sortOrd ?? "asc"}`
			: "title:asc",
	},
});

const BrowsePage: QueryPage<{ slug?: string }> = ({ slug }) => {
	const [sortKey, setSort] = useState(SortBy.Name);
	const [sortOrd, setSortOrd] = useState(SortOrd.Asc);
	const [layout, setLayout] = useState(Layout.Grid);
	const { items, fetchNextPage, hasNextPage, error } = useInfiniteFetch(
		query(slug, sortKey, sortOrd),
	);

	if (error) return <ErrorPage {...error} />;

	return (
		<>
			<BrowseSettings
				sortKey={sortKey}
				setSort={setSort}
				sortOrd={sortOrd}
				setSortOrd={setSortOrd}
				layout={layout}
				setLayout={setLayout}
			/>
			<InfiniteScroll
				dataLength={items?.length ?? 0}
				next={fetchNextPage}
				hasMore={hasNextPage!}
				loader={[...Array(12).map((_, i) => <Item key={i} layout={layout} />)]}
				sx={{
					display: "flex",
					flexWrap: "wrap",
					alignItems: "flex-start",
					justifyContent: "center",
				}}
			>
				{(items ?? [...Array(12)]).map((x, i) => (
					<Item key={x?.id ?? i} item={x} layout={layout} />
				))}
			</InfiniteScroll>
		</>
	);
};

BrowsePage.getLayout = (page) => {
	return (
		<>
			<Navbar />
			<main>{page}</main>
		</>
	);
};

BrowsePage.getFetchUrls = ({ slug, sortBy }) => [
	query(slug, sortBy?.split("-")[0] as SortBy, sortBy?.split("-")[1] as SortOrd),
	Navbar.query(),
];

export default withRoute(BrowsePage);
