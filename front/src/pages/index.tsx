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

import type { NextPage } from "next";
import { Stack, Button } from "@mui/material";
import Link from "next/link";
// import { Link } from "~/utils/link";

const Home: NextPage = () => {
	return (
		<div>
			<main>
				<h1>
					Welcome to <a href="https://nextjs.org">Next.js!</a>
				</h1>
				<Stack spacing={2} direction="row">
					<Button variant="text">Text</Button>
					<Button variant="contained">Contained</Button>
					<Button variant="outlined">Outlined</Button>
					<Link href="toto">Toto</Link>
				</Stack>
			</main>
		</div>
	);
};

export default Home;
