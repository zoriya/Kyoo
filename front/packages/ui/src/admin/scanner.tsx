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

import { Issue, IssueP, QueryIdentifier, queryFn, useFetch } from "@kyoo/models";
import { useTranslation } from "react-i18next";
import { SettingsContainer } from "../settings/base";
import { Button, Icon, P, Skeleton, tooltip, ts } from "@kyoo/primitives";
import { ErrorView } from "../errors";
import { z } from "zod";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";

import Info from "@material-symbols/svg-400/outlined/info.svg";
import Scan from "@material-symbols/svg-400/outlined/sensors.svg";
import { useMutation } from "@tanstack/react-query";

export const Scanner = () => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const { data, error } = useFetch(Scanner.query());

	const metadataRefreshMutation = useMutation({
		mutationFn: () =>
			queryFn({
				path: ["rescan"],
				method: "POST",
			}),
	});

	return (
		<SettingsContainer
			title={t("admin.scanner.label")}
			extraTop={
				<Button
					licon={<Icon icon={Scan} {...css({ marginX: ts(1) })} />}
					text={t("admin.scanner.scan")}
					onPress={() => metadataRefreshMutation.mutate()}
					{...css({ marginBottom: ts(2) })}
				/>
			}
		>
			<>
				{error != null ? (
					<ErrorView error={error} />
				) : (
					(data ?? [...Array(3)])?.map((x, i) => (
						<View
							key={x?.cause ?? `${i}`}
							{...css({
								marginY: ts(1),
								marginX: ts(3),
								flexDirection: "row",
								alignItems: "center",
								flexGrow: 1,
							})}
						>
							<Icon
								icon={Info}
								{...css({ flexShrink: 0, marginRight: ts(2) })}
								{...tooltip(x?.cause)}
							/>
							<Skeleton>
								{x && <P {...css({ flexGrow: 1, flexShrink: 1, flexWrap: "wrap" })}>{x.reason}</P>}
							</Skeleton>
						</View>
					))
				)}
				{data != null && data.length === 0 && <P>{t("admin.scanner.empty")}</P>}
			</>
		</SettingsContainer>
	);
};

Scanner.query = (): QueryIdentifier<Issue[]> => ({
	parser: z.array(IssueP),
	path: ["issues"],
	params: {
		filter: "domain eq scanner",
	},
});
