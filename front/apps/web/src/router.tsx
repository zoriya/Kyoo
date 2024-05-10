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

import { type QueryPage, useHasPermission } from "@kyoo/models";
import { Unauthorized } from "@kyoo/ui";
import { useRouter } from "next/router";
import type { ComponentType } from "react";

export const withRoute = <Props,>(
	Component: ComponentType<Props>,
	defaultProps?: Partial<Props>,
) => {
	const WithUseRoute = (props: Props) => {
		const router = useRouter();
		const hasPermissions = useHasPermission((Component as QueryPage).requiredPermissions ?? []);

		if (!hasPermissions)
			return <Unauthorized missing={(Component as QueryPage).requiredPermissions!} />;
		return <Component {...defaultProps} {...router.query} {...(props as any)} />;
	};

	const { ...all } = Component;
	Object.assign(WithUseRoute, { ...all });
	if ("getFetchUrls" in Component) {
		const oldGet = Component.getFetchUrls as (obj: object) => object;
		WithUseRoute.getFetchUrls = (props: object) => oldGet({ ...defaultProps, ...props });
	}

	return WithUseRoute;
};
