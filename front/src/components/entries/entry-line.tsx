import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import ExpandLess from "@material-symbols/svg-400/rounded/keyboard_arrow_up-fill.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, type PressableProps, View } from "react-native";
import { percent, type Stylable, useYoshiki } from "yoshiki/native";
import { EntryContext } from "~/components/items/context-menus";
import { ItemProgress } from "~/components/items/item-grid";
import type { KImage } from "~/models";
import {
	focusReset,
	H6,
	IconButton,
	Image,
	ImageBackground,
	important,
	Link,
	P,
	Skeleton,
	SubP,
	tooltip,
	ts,
} from "~/primitives";
import type { Layout } from "~/query";
import { displayRuntime } from "~/utils";

export const EntryLine = ({
	slug,
	serieSlug,
	name,
	thumbnail,
	poster,
	description,
	displayNumber,
	airDate,
	runtime,
	watchedPercent,
	href,
	...props
}: {
	slug: string;
	// if show slug is null, disable "Go to show" in the context menu
	serieSlug: string | null;
	displayNumber: string;
	name: string | null;
	description: string | null;
	thumbnail: KImage | null;
	poster?: KImage | null;
	airDate: Date | null;
	runtime: number | null;
	watchedPercent: number | null;
	href: string | null;
} & PressableProps) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const [descriptionExpanded, setDescriptionExpanded] = useState(false);
	const { css } = useYoshiki("episode-line");
	const { t } = useTranslation();

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			{...css(
				{
					alignItems: "center",
					flexDirection: "row",
					child: {
						more: {
							opacity: 0,
						},
					},
					fover: {
						self: focusReset,
						title: {
							textDecorationLine: "underline",
						},
						more: {
							opacity: 1,
						},
					},
				},
				props,
			)}
		>
			<ImageBackground
				src={poster ?? thumbnail}
				quality="low"
				alt=""
				layout={{
					width: percent(18),
					aspectRatio: poster ? 2 / 3 : 16 / 9,
				}}
				{...(css({ flexShrink: 0, m: ts(1), borderRadius: 6 }) as any)}
			>
				{watchedPercent && (
					<ItemProgress watchPercent={watchedPercent ?? 100} />
				)}
			</ImageBackground>
			<View {...css({ flexGrow: 1, flexShrink: 1, m: ts(1) })}>
				<View
					{...css({
						flexGrow: 1,
						flexShrink: 1,
						flexDirection: "row",
						justifyContent: "space-between",
					})}
				>
					{/* biome-ignore lint/a11y/useValidAriaValues: simply use H6 for the style but keep a P */}
					<H6 aria-level={undefined} {...css([{ flexShrink: 1 }, "title"])}>
						{[displayNumber, name ?? t("show.episodeNoMetadata")]
							.filter((x) => x)
							.join(" · ")}
					</H6>
					<View {...css({ flexDirection: "row", alignItems: "center" })}>
						<SubP>
							{[
								airDate
									? // @ts-expect-error Source https://www.i18next.com/translation-function/formatting#datetime
										t("{{val, datetime}}", { val: airDate })
									: null,
								displayRuntime(runtime),
							]
								.filter((item) => item != null)
								.join(" · ")}
						</SubP>
						<EntryContext
							slug={slug}
							serieSlug={serieSlug}
							isOpen={moreOpened}
							setOpen={(v) => setMoreOpened(v)}
							{...css([
								"more",
								{ display: "flex", marginLeft: ts(3) },
								Platform.OS === "web" &&
									moreOpened && { display: important("flex") },
							])}
						/>
					</View>
				</View>
				<View
					{...css({ flexDirection: "row", justifyContent: "space-between" })}
				>
					<P numberOfLines={descriptionExpanded ? undefined : 3}>
						{description}
					</P>
					<IconButton
						{...css(["more", Platform.OS !== "web" && { opacity: 1 }])}
						icon={descriptionExpanded ? ExpandLess : ExpandMore}
						{...tooltip(
							t(descriptionExpanded ? "misc.collapse" : "misc.expand"),
						)}
						onPress={(e) => {
							e.preventDefault();
							setDescriptionExpanded((isExpanded) => !isExpanded);
						}}
					/>
				</View>
			</View>
		</Link>
	);
};

EntryLine.Loader = (props: Stylable) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					alignItems: "center",
					flexDirection: "row",
				},
				props,
			)}
		>
			<Image.Loader
				layout={{
					width: percent(18),
					aspectRatio: 16 / 9,
				}}
				{...css({ flexShrink: 0, m: ts(1) })}
			/>
			<View {...css({ flexGrow: 1, flexShrink: 1, m: ts(1) })}>
				<View
					{...css({
						flexGrow: 1,
						flexShrink: 1,
						flexDirection: "row",
						justifyContent: "space-between",
					})}
				>
					<Skeleton {...css({ width: percent(30) })} />
					<Skeleton {...css({ width: percent(15) })} />
				</View>
				<Skeleton />
			</View>
		</View>
	);
};

EntryLine.layout = {
	numColumns: 1,
	size: 100,
	layout: "vertical",
	gap: ts(1),
} satisfies Layout;
