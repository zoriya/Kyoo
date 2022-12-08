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
				src={thumbnail}
				alt={name}
				width="100%"
				height="100%"
				radius={px(5)}
				css={{
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
				src={poster}
				alt=""
				height="80%"
				css={{
					transition: "transform .2s",
				}}
			/>
		</Link>
	);
};
