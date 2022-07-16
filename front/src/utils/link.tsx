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

// This file was shamelessly taken from:
// https://github.com/mui/material-ui/tree/master/examples/nextjs

import * as React from "react";
import clsx from "clsx";
import { useRouter } from "next/router";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import MuiLink, { LinkProps as MuiLinkProps } from "@mui/material/Link";
import { styled } from "@mui/material/styles";

// Add support for the sx prop for consistency with the other branches.
const Anchor = styled("a")({});

interface NextLinkComposedProps
	extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
		Omit<NextLinkProps, "href" | "as" | "onClick" | "onMouseEnter"> {
	to: NextLinkProps["href"];
	linkAs?: NextLinkProps["as"];
}

export const NextLinkComposed = React.forwardRef<HTMLAnchorElement, NextLinkComposedProps>(
	function NextLinkComposed(props, ref) {
		const { to, linkAs, replace, scroll, shallow, prefetch, locale, ...other } = props;

		return (
			<NextLink
				href={to}
				prefetch={prefetch}
				as={linkAs}
				replace={replace}
				scroll={scroll}
				shallow={shallow}
				passHref
				locale={locale}
			>
				<Anchor ref={ref} {...other} />
			</NextLink>
		);
	},
);

export type LinkProps = {
	activeClassName?: string;
	as?: NextLinkProps["as"];
	href: NextLinkProps["href"];
	linkAs?: NextLinkProps["as"]; // Useful when the as prop is shallow by styled().
	noLinkStyle?: boolean;
} & Omit<NextLinkComposedProps, "to" | "linkAs" | "href"> &
	Omit<MuiLinkProps, "href">;

// A styled version of the Next.js Link component:
// https://nextjs.org/docs/api-reference/next/link
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
	const {
		activeClassName = "active",
		as,
		className: classNameProps,
		href,
		linkAs: linkAsProp,
		locale,
		noLinkStyle,
		prefetch,
		replace,
		role, // Link don't have roles.
		scroll,
		shallow,
		...other
	} = props;

	const router = useRouter();
	const pathname = typeof href === "string" ? href : href.pathname;
	const className = clsx(classNameProps, {
		[activeClassName]: router.pathname === pathname && activeClassName,
	});

	const isExternal =
		typeof href === "string" && (href.indexOf("http") === 0 || href.indexOf("mailto:") === 0);

	if (isExternal) {
		if (noLinkStyle) {
			return <Anchor className={className} href={href} ref={ref} {...other} />;
		}

		return <MuiLink className={className} href={href} ref={ref} {...other} />;
	}

	const linkAs = linkAsProp || as;
	const nextjsProps = { to: href, linkAs, replace, scroll, shallow, prefetch, locale };

	if (noLinkStyle) {
		return <NextLinkComposed className={className} ref={ref} {...nextjsProps} {...other} />;
	}

	return (
		<MuiLink
			component={NextLinkComposed}
			className={className}
			ref={ref}
			{...nextjsProps}
			{...other}
		/>
	);
});

export default Link;
