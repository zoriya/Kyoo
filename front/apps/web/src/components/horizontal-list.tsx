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

import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { ReactNode, useRef } from "react";
import { Container } from "./container";
import useTranslation from "next-translate/useTranslation";

export const HorizontalList = ({
	title,
	noContent,
	children,
}: {
	title: string;
	noContent: string;
	children: ReactNode[];
}) => {
	const { t } = useTranslation("browse");
	const ref = useRef<HTMLDivElement>(null);
	const getScrollSize = () => {
		const childSize = ref.current?.children[0].clientWidth;
		const containerSize = ref.current?.offsetWidth;

		if (!childSize || !containerSize) return childSize || 150;
		return Math.round(containerSize / childSize) * childSize;
	};

	// TODO: handle infinite scroll

	return (
		<>
			<Container
				sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", py: 3 }}
			>
				<Typography variant="h4" component="h2">
					{title}
				</Typography>
				<Box>
					<Tooltip title={t("misc.prev-page")}>
						<IconButton
							aria-label={t("misc.prev-page")}
							onClick={() => ref.current?.scrollBy({ left: -getScrollSize(), behavior: "smooth" })}
						>
							<ArrowLeft />
						</IconButton>
					</Tooltip>
					<Tooltip title={t("misc.next-page")}>
						<IconButton
							aria-label={t("misc.next-page")}
							onClick={() => ref.current?.scrollBy({ left: getScrollSize(), behavior: "smooth" })}
						>
							<ArrowRight />
						</IconButton>
					</Tooltip>
				</Box>
			</Container>
			{children.length == 0 ? (
				<Box sx={{ display: "flex", justifyContent: "center" }}>
					<Typography sx={{ py: 3 }}>{noContent}</Typography>
				</Box>
			) : (
				<Container
					sx={{
						display: "flex",
						flexDirection: "row",
						maxWidth: "100%",
						overflowY: "auto",
						pt: 1,
						pb: 2,
						overflowX: "visible",
					}}
					ref={ref}
				>
					{children}
				</Container>
			)}
		</>
	);
};
