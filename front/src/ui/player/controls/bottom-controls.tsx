import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View, type ViewProps } from "react-native";
import type { VideoPlayer } from "react-native-video";
import { percent, useYoshiki } from "yoshiki/native";
import type { Chapter, KImage } from "~/models";
import {
	H2,
	IconButton,
	Link,
	type Menu,
	noTouch,
	Poster,
	tooltip,
	ts,
} from "~/primitives";
import { FullscreenButton, PlayButton, VolumeSlider } from "./misc";
import { ProgressBar, ProgressText } from "./progress";
import { AudioMenu, QualityMenu, SubtitleMenu } from "./tracks-menu";

export const BottomControls = ({
	player,
	poster,
	name,
	chapters,
	previous,
	next,
	setMenu,
	...props
}: {
	player: VideoPlayer;
	poster: KImage;
	name: string;
	chapters: Chapter[];
	previous: string | null;
	next: string | null;
	setMenu: (isOpen: boolean) => void;
} & ViewProps) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					flexDirection: "row",
					padding: ts(1),
				},
				props,
			)}
		>
			<View
				{...css({
					width: "15%",
					display: { xs: "none", sm: "flex" },
					position: "relative",
				})}
			>
				<Poster
					src={poster}
					quality="low"
					layout={{ width: percent(100) }}
					{...(css({ position: "absolute", bottom: 0 }) as any)}
				/>
			</View>
			<View
				{...css({
					marginLeft: { xs: ts(0.5), sm: ts(3) },
					flexDirection: "column",
					flexGrow: 1,
					flexShrink: 1,
					maxWidth: percent(100),
				})}
			>
				<H2 numberOfLines={1} {...css({ paddingBottom: ts(1) })}>
					name
				</H2>
				<ProgressBar player={player} chapters={chapters} />
				<ControlButtons
					player={player}
					previous={previous}
					next={next}
					setMenu={setMenu}
				/>
			</View>
		</View>
	);
};

const ControlButtons = ({
	player,
	previous,
	next,
	setMenu,
	...props
}: {
	player: VideoPlayer;
	previous: string | null;
	next: string | null;
	setMenu: (isOpen: boolean) => void;
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	const spacing = css({ marginHorizontal: ts(1) });
	const menuProps = {
		onMenuOpen: () => setMenu(true),
		onMenuClose: () => setMenu(false),
		...spacing,
	} satisfies Partial<ComponentProps<typeof Menu>>;

	return (
		<View
			{...css(
				{
					flexDirection: "row",
					flexGrow: 1,
					justifyContent: "space-between",
					flexWrap: "wrap",
				},
				props,
			)}
		>
			<View {...css({ flexDirection: "row" })}>
				<View {...css({ flexDirection: "row" }, noTouch)}>
					{previous && (
						<IconButton
							icon={SkipPrevious}
							as={Link}
							href={previous}
							replace
							{...tooltip(t("player.previous"), true)}
							{...spacing}
						/>
					)}
					<PlayButton player={player} {...spacing} />
					{next && (
						<IconButton
							icon={SkipNext}
							as={Link}
							href={next}
							replace
							{...tooltip(t("player.next"), true)}
							{...spacing}
						/>
					)}
					{Platform.OS === "web" && <VolumeSlider player={player} />}
				</View>
				<ProgressText player={player} {...spacing} />
			</View>
			<View {...css({ flexDirection: "row" })}>
				<SubtitleMenu {...menuProps}  />
				<AudioMenu {...menuProps} />
				<QualityMenu {...menuProps} />
				{Platform.OS === "web" && <FullscreenButton {...spacing} />}
			</View>
		</View>
	);
};
