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

import { IconButton, Menu, tooltip } from "@kyoo/primitives";
import { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import Info from "@material-symbols/svg-400/rounded/info.svg";

export const EpisodesContext = ({
	showSlug,
	...props
}: { showSlug: string } & Partial<ComponentProps<typeof Menu<typeof IconButton>>>) => {
	const { t } = useTranslation();

	return (
		<Menu Trigger={IconButton} icon={MoreVert} {...tooltip(t("misc.more"))} {...(props as any)}>
			<Menu.Item label={t("home.episodeMore.goToShow")} icon={Info} href={`/show/${showSlug}`} />
		</Menu>
	);
};
