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

import {
	CircularProgress,
	ContrastArea,
	H1,
	H2,
	IconButton,
	Link,
	Poster,
	Skeleton,
	tooltip,
	ts,
} from "@kyoo/primitives";
import { Chapter, Font, Track } from "@kyoo/models";
import { useAtomValue } from "jotai";
import { Pressable, View, ViewProps } from "react-native";
import { useRouter } from "solito/router";
import ArrowBack from "@material-symbols/svg-400/rounded/arrow_back-fill.svg";
import { LeftButtons } from "./left-buttons";
import { RightButtons } from "./right-buttons";
import { ProgressBar } from "./progress-bar";
import { loadAtom } from "../state";
import { useTranslation } from "react-i18next";
import { percent, rem, useYoshiki } from "yoshiki/native";

export const Hover = ({
	isLoading,
	name,
	showName,
	href,
	poster,
	chapters,
	subtitles,
	fonts,
	previousSlug,
	nextSlug,
	onMenuOpen,
	onMenuClose,
	show,
	...props
}: {
	isLoading: boolean;
	name?: string | null;
	showName?: string;
	href?: string;
	poster?: string | null;
	chapters?: Chapter[];
	subtitles?: Track[];
	fonts?: Font[];
	previousSlug?: string | null;
	nextSlug?: string | null;
	onMenuOpen: () => void;
	onMenuClose: () => void;
	show: boolean;
} & ViewProps) => {
	// TODO animate show
	return (
		<ContrastArea mode="dark">
			{({ css }) => (
				<View {...css([{ flexGrow: 1 }, !show && { opacity: 0 }])}>
					<Back isLoading={isLoading} name={showName} href={href} {...props} />
					<View
						{...css(
							{
								position: "absolute",
								bottom: 0,
								left: 0,
								right: 0,
								bg: "rgba(0, 0, 0, 0.6)",
								flexDirection: "row",
								padding: percent(1),
							},
							props,
						)}
					>
						<VideoPoster poster={poster} />
						<View
							{...css({
								marginLeft: { xs: ts(0.5), sm: ts(3) },
								flexDirection: "column",
								flexGrow: 1,
							})}
						>
							<H2 {...css({ paddingBottom: ts(1) })}>
								{isLoading ? <Skeleton {...css({ width: rem(15), height: rem(2) })} /> : name}
							</H2>
							<ProgressBar chapters={chapters} />
							<View
								{...css({ flexDirection: "row", flexGrow: 1, justifyContent: "space-between" })}
							>
								<LeftButtons previousSlug={previousSlug} nextSlug={nextSlug} />
								<RightButtons
									subtitles={subtitles}
									fonts={fonts}
									onMenuOpen={onMenuOpen}
									onMenuClose={onMenuClose}
								/>
							</View>
						</View>
					</View>
				</View>
			)}
		</ContrastArea>
	);
};
export const Back = ({
	isLoading,
	name,
	href,
	...props
}: { isLoading: boolean; name?: string; href?: string } & ViewProps) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<View
			{...css(
				{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bg: "rgba(0, 0, 0, 0.6)",
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					padding: percent(0.33),
					color: "white",
				},
				props,
			)}
		>
			<IconButton
				icon={ArrowBack}
				{...(href ? { as: Link as any, href: href } : { as: Pressable, onPress: router.back })}
				{...tooltip(t("player.back"))}
			/>
			<Skeleton>
				{isLoading ? (
					<Skeleton {...css({ width: rem(5), marginBottom: 0 })} />
				) : (
					<H1
						{...css({
							alignSelf: "center",
							marginBottom: 0,
							fontSize: rem(1.5),
							marginLeft: rem(1),
						})}
					>
						{name}
					</H1>
				)}
			</Skeleton>
		</View>
	);
};

const VideoPoster = ({ poster }: { poster?: string | null }) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				width: "15%",
				display: { xs: "none", sm: "flex" },
				position: "relative",
			})}
		>
			<Poster
				src={poster}
				layout={{ width: percent(100) }}
				{...css({ position: "absolute", bottom: 0 })}
			/>
		</View>
	);
};

export const LoadingIndicator = () => {
	const isLoading = useAtomValue(loadAtom);
	const { css } = useYoshiki();

	if (!isLoading) return null;

	return (
		<View
			{...css({
				position: "absolute",
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				bg: "rgba(0, 0, 0, 0.3)",
				justifyContent: "center",
			})}
		>
			<CircularProgress {...css({ alignSelf: "center" })} />
		</View>
	);
};
