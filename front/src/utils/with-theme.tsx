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

import { Theme, useThemeProps, styled } from "@mui/material";
import { MUIStyledCommonProps, MuiStyledOptions } from "@mui/system";
import { FilteringStyledOptions } from "@mui/styled-engine";
import { WithConditionalCSSProp } from "@emotion/react/types/jsx-namespace";
import clsx from "clsx";

export interface ClassNameProps {
	className?: string;
}

export const withThemeProps = <P,>(
	component: React.ComponentType<P>,
	options?: FilteringStyledOptions<P> & MuiStyledOptions,
) => {
	const name = options?.name || component.displayName;
	const Component = styled(component, options)<P>(() => ({}));

	const WithTheme = (
		inProps: P &
			WithConditionalCSSProp<P & MUIStyledCommonProps<Theme>> &
			ClassNameProps &
			MUIStyledCommonProps<Theme>,
	) => {
		if (!name) {
			console.error(
				"withTheme could not be defined because the underlining component does not have a display name and the name option was not specified.",
			);
			return <Component {...inProps} />;
		}
		const props = useThemeProps({ props: inProps, name: name });
		const className = clsx(props.className, `${name}-${options?.slot ?? "Root"}`);
		return <Component {...props} className={className} />;
	};
	WithTheme.displayName = `WithThemeProps(${name || "Component"})`;
	return WithTheme;
};
