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

import { z } from "zod";
import { zdate } from "./utils";

export const IssueP = z.object({
	/**
	 * The type of issue (for example, "Scanner" if this issue was created due to scanning error).
	 */
	domain: z.string(),
	/**
	 * Why this issue was caused? An unique cause that can be used to identify this issue.
	 * For the scanner, a cause should be a video path.
	 */
	cause: z.string(),
	/**
	 * A human readable string explaining why this issue occured.
	 */
	reason: z.string(),
	/**
	 * Some extra data that could store domain-specific info.
	 */
	extra: z.record(z.string(), z.any()),
	/**
	 * The date the issue was reported.
	 */
	addedDate: zdate(),
});

export type Issue = z.infer<typeof IssueP>;
