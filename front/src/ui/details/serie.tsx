import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import Svg, { Path, type SvgProps } from "react-native-svg";
import { percent, useYoshiki } from "yoshiki/native";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import { Container, focusReset, H2, SwitchVariant, ts } from "~/primitives";
import { useQueryState } from "~/utils";
import { Header } from "./header";
import { EntryList } from "./season";

export const SvgWave = (props: SvgProps) => {
	const { css } = useYoshiki();
	const width = 612;
	const height = 52.771;

	return (
		<View {...css({ width: percent(100), aspectRatio: width / height })}>
			<Svg
				width="100%"
				height="100%"
				viewBox="0 372.979 612 52.771"
				fill="black"
				{...props}
			>
				<Path d="M0,375.175c68,-5.1,136,-0.85,204,7.948c68,9.052,136,22.652,204,24.777s136,-8.075,170,-12.878l34,-4.973v35.7h-612" />
			</Svg>
		</View>
	);
};

export const ShowWatchStatusCard = ({
	watchedPercent,
	nextEpisode,
}: ShowWatchStatus) => {
	const { t } = useTranslation();
	const [focused, setFocus] = useState(false);

	if (!nextEpisode) return null;

	return (
		<SwitchVariant>
			{({ css }) => (
				<Container
					{...css([
						{
							marginY: ts(2),
							borderRadius: 16,
							overflow: "hidden",
							borderWidth: ts(0.5),
							borderStyle: "solid",
							borderColor: (theme) => theme.background,
							backgroundColor: (theme) => theme.background,
						},
						focused && {
							...focusReset,
							borderColor: (theme) => theme.accent,
						},
					])}
				>
					<H2 {...css({ marginLeft: ts(2) })}>{t("show.nextUp")}</H2>
					<EntryLine
						{...nextEpisode}
						serieSlug={null}
						watchedPercent={watchedPercent || null}
						displayNumber={entryDisplayNumber(nextEpisode)}
						onHoverIn={() => setFocus(true)}
						onHoverOut={() => setFocus(false)}
						onFocus={() => setFocus(true)}
						onBlur={() => setFocus(false)}
					/>
				</Container>
			)}
		</SwitchVariant>
	);
};

const SerieHeader = ({ children, ...props }: any) => {
	const { css, theme } = useYoshiki();
	const [slug] = useQueryState("slug", undefined!);

	return (
		<View
			{...css(
				[
					{ bg: (theme) => theme.background },
					Platform.OS === "web" && {
						flexGrow: 1,
						flexShrink: 1,
						// @ts-ignore Web only property
						overflowY: "auto" as any,
					},
				],
				props,
			)}
		>
			<Header kind="serie" slug={slug} />
			{/* <DetailsCollections type="serie" slug={slug} /> */}
			{/* <Staff slug={slug} /> */}
			<SvgWave
				fill={theme.variant.background}
				{...css({ flexShrink: 0, flexGrow: 1, display: "flex" })}
			/>
			<View {...css({ bg: theme.variant.background })}>
				<Container>{children}</Container>
			</View>
		</View>
	);
};

export const SerieDetails = () => {
	const { css, theme } = useYoshiki();
	const [slug] = useQueryState("slug", undefined!);
	const [season] = useQueryState("season", undefined!);

	return (
		<View {...css({ bg: theme.variant.background, flex: 1 })}>
			<EntryList slug={slug} season={season} Header={SerieHeader} />
		</View>
	);
};
