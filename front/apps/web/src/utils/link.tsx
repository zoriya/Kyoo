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

import { forwardRef, Ref } from "react";
import NLink, { LinkProps as NLinkProps } from "next/link";
import {
	Button as MButton,
	ButtonProps,
	Link as MLink,
	LinkProps as MLinkProps,
} from "@mui/material";

type ButtonRef = HTMLButtonElement;
type ButtonLinkProps = Omit<ButtonProps, "href"> &
	Pick<NLinkProps, "href" | "as" | "prefetch" | "locale">;

const NextButton = (
	{ href, as, prefetch, locale, ...props }: ButtonLinkProps,
	ref: Ref<ButtonRef>,
) => (
	<NLink href={href} as={as} prefetch={prefetch} locale={locale} legacyBehavior passHref>
		<MButton ref={ref} {...props} />
	</NLink>
);

export const ButtonLink = forwardRef<ButtonRef, ButtonLinkProps>(NextButton);

type LinkRef = HTMLAnchorElement;
type LinkProps = Omit<MLinkProps, "href"> &
	Pick<NLinkProps, "as" | "prefetch" | "locale" | "shallow" | "replace"> &
	({ to: NLinkProps["href"]; href?: undefined } | { href: NLinkProps["href"]; to?: undefined });

const NextLink = (
	{ href, to, as, prefetch, locale, shallow, replace, ...props }: LinkProps,
	ref: Ref<LinkRef>,
) => (
	<NLink
		href={href ?? to}
		as={as}
		prefetch={prefetch}
		locale={locale}
		shallow={shallow}
		replace={replace}
		passHref
		legacyBehavior
	>
		<MLink ref={ref} {...props} />
	</NLink>
);

export const Link = forwardRef<LinkRef, LinkProps>(NextLink);
