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

import { QueryPage } from "@kyoo/models";
import { Button, P, Input, ts, H1, A, IconButton } from "@kyoo/primitives";
import { ComponentProps, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageBackground, ImageProps, Platform, View } from "react-native";
import { Trans } from "react-i18next";
import { min, percent, px, useYoshiki, vh, vw } from "yoshiki/native";
import Visibility from "@material-symbols/svg-400/rounded/visibility-fill.svg";
import VisibilityOff from "@material-symbols/svg-400/rounded/visibility_off-fill.svg";
import { DefaultLayout } from "../layout";
import Svg, { SvgProps, Path } from "react-native-svg";

const SvgBlob = (props: SvgProps) => {
	const { css, theme } = useYoshiki();

	return (
		<View {...css({ width: percent(100), aspectRatio: 5 / 6 }, props)}>
			<Svg width="100%" height="100%" viewBox="0 0 500 600">
				<Path
					d="M459.7 0c-20.2 43.3-40.3 86.6-51.7 132.6-11.3 45.9-13.9 94.6-36.1 137.6-22.2 43-64.1 80.3-111.5 88.2s-100.2-13.7-144.5-1.8C71.6 368.6 35.8 414.2 0 459.7V0h459.7z"
					fill={theme.background}
				/>
			</Svg>
		</View>
	);
};

const PasswordInput = (props: ComponentProps<typeof Input>) => {
	const { css } = useYoshiki();
	const [show, setVisibility] = useState(false);

	return (
		<Input
			secureTextEntry={!show}
			right={
				<IconButton
					icon={show ? VisibilityOff : Visibility}
					size={19}
					onPress={() => setVisibility(!show)}
					{...css({ width: px(19), height: px(19), m: 0, p: 0 })}
				/>
			}
			{...props}
		/>
	);
};

export const LoginPage: QueryPage = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	// TODO: Replace the hardcoded 1 to a random show/movie thumbnail.
	// TODO: Use a dynamic path for RN
	const src = `/api/shows/1/thumbnail`;
	const nativeProps = Platform.select<ImageProps>({
		web: {
			defaultSource: typeof src === "string" ? { uri: src! } : Array.isArray(src) ? src[0] : src!,
		},
		default: {},
	});

	return (
		<ImageBackground
			source={{ uri: src }}
			{...nativeProps}
			{...css({
				flexDirection: "row",
				flexGrow: 1,
				backgroundColor: (theme) => theme.dark.background,
			})}
		>
			<View
				{...css({
					width: min(vh(90), px(1200)),
					height: min(vh(90), px(1200)),
				})}
			>
				<SvgBlob {...css({ position: "absolute", top: 0, left: 0 })} />
				<View
					{...css({
						width: percent(75),
						maxWidth: vw(100),
						paddingHorizontal: ts(3),
						marginTop: ts(6),
					})}
				>
					<H1>{t("login.login")}</H1>
					<P {...css({ paddingLeft: ts(1) })}>{t("login.email")}</P>
					<Input autoComplete="email" variant="big" />
					<P {...css({ paddingLeft: ts(1) })}>{t("login.password")}</P>
					<PasswordInput autoComplete="password" variant="big" />
					<Button
						text={t("login.login")}
						{...css({
							m: ts(1),
							width: px(250),
							maxWidth: percent(100),
							alignSelf: "center",
							mY: ts(3),
						})}
					/>
					<P>
						<Trans i18nKey="login.or-register">
							Don’t have an account? <A href="/register">Register</A>.
						</Trans>
					</P>
				</View>
			</View>
		</ImageBackground>
	);
};

LoginPage.getLayout = DefaultLayout;
