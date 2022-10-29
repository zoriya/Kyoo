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

import { forwardRef } from "react";

export const Heading = forwardRef<
	HTMLHeadingElement,
	{
		variant: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
		children?: JSX.Element | JSX.Element[];
	}
>(function Heading({ variant = "h1", children, ...props }, ref) {
	const H = variant;
	return (
		<H
			ref={ref}
			{...props}
			css={(theme) => ({
				font: theme.fonts.heading,
				color: theme.heading,
			})}
			className={`Heading Heading-${variant}`}
		>
			{children}
		</H>
	);
});


export const Paragraph = forwardRef<
	HTMLParagraphElement,
	{
		variant: "normal" | "subtext";
		children?: JSX.Element | JSX.Element[];
	}
>(function Paragraph({ variant, children, ...props }, ref) {
	return (
		<p
			ref={ref}
			{...props}
			css={(theme) => ({
				font: theme.fonts.paragraph,
				color: variant === "normal" ? theme.paragraph : theme.subtext,
			})}
			className={`Paragraph Paragraph-${variant}`}
		>
			{children}
		</p>
	);
});
