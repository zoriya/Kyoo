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

import { QueryIdentifier, QueryPage } from "~/utils/query";
import { withRoute } from "~/utils/router";
import { WatchItem, WatchItemP } from "~/models/resources/watch-item";
import { useFetch } from "~/utils/query";
import { ErrorPage } from "~/components/errors";
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useAtomValue } from "jotai";
import { Hover, LoadingIndicator } from "./components/hover";
import { playAtom, useSubtitleController, useVideoController } from "./state";

// Callback used to hide the controls when the mouse goes iddle. This is stored globally to clear the old timeout
// if the mouse moves again (if this is stored as a state, the whole page is redrawn on mouse move)
let mouseCallback: NodeJS.Timeout;

const query = (slug: string): QueryIdentifier<WatchItem> => ({
	path: ["watch", slug],
	parser: WatchItemP,
});

const Player: QueryPage<{ slug: string }> = ({ slug }) => {
	const { data, error } = useFetch(query(slug));
	const { playerRef, videoProps } = useVideoController();

	const isPlaying = useAtomValue(playAtom);
	const [showHover, setHover] = useState(false);
	const [mouseMoved, setMouseMoved] = useState(false);
	const displayControls = showHover || !isPlaying || mouseMoved;

	useEffect(() => {
		const handler = () => {
			setMouseMoved(true);
			if (mouseCallback) clearTimeout(mouseCallback);
			mouseCallback = setTimeout(() => {
				setMouseMoved(false);
			}, 2500);
		};

		document.addEventListener("mousemove", handler);
		return () => document.removeEventListener("mousemove", handler);
	});

	useSubtitleController(playerRef, data?.subtitles, data?.fonts);

	if (error) return <ErrorPage {...error} />;

	return (
		<Box
			onMouseLeave={() => setMouseMoved(false)}
			sx={{ cursor: displayControls ? "unset" : "none" }}
		>
			<Box
				component="video"
				src={data?.link.direct}
				{...videoProps}
				sx={{
					position: "absolute",
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					width: "100%",
					height: "100%",
					objectFit: "contain",
					background: "black",
				}}
			/>
			<LoadingIndicator />
			<Hover
				data={data}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
				sx={
					displayControls
						? {
								visibility: "visible",
								opacity: 1,
								transition: "opacity .2s ease-in",
						  }
						: {
								visibility: "hidden",
								opacity: 0,
								transition: "opacity .4s ease-out, visibility 0s .4s",
						  }
				}
			/>
		</Box>
	);
};

Player.getFetchUrls = ({ slug }) => [query(slug)];

export default withRoute(Player);
