import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { calc, percent, px, rem, type Theme, useYoshiki } from "yoshiki/native";
import { ItemGrid } from "~/components/items";
import { ItemContext } from "~/components/items/context-menus";
import { ItemWatchStatus } from "~/components/items/item-helpers";
import { type Genre, type KImage, Show, type WatchStatusV } from "~/models";
import {
	Chip,
	focusReset,
	H3,
	IconFab,
	Link,
	P,
	PosterBackground,
	Skeleton,
	SubP,
	tooltip,
	ts,
} from "~/primitives";
import { InfiniteFetch, type Layout, type QueryIdentifier } from "~/query";
import { getDisplayDate } from "~/utils";

export const ItemDetails = ({
	slug,
	kind,
	name,
	tagline,
	subtitle,
	description,
	poster,
	genres,
	href,
	playHref,
	watchStatus,
	availableCount,
	seenCount,
	...props
}: {
	slug: string;
	kind: "movie" | "serie" | "collection";
	name: string;
	tagline: string | null;
	subtitle: string | null;
	poster: KImage | null;
	genres: Genre[] | null;
	description: string | null;
	href: string;
	playHref: string | null;
	watchStatus: WatchStatusV | null;
	availableCount?: number | null;
	seenCount?: number | null;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const { css } = useYoshiki("recommended-card");
	const { t } = useTranslation();

	return (
		<View
			{...css(
				{
					height: ItemDetails.layout.size,
				},
				props,
			)}
		>
			<Link
				href={moreOpened ? undefined : href}
				onLongPress={() => setMoreOpened(true)}
				{...css({
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					flexDirection: "row",
					bg: (theme) => theme.variant.background,
					borderRadius: px(12),
					overflow: "hidden",
					borderColor: (theme) => theme.background,
					borderWidth: ts(0.25),
					borderStyle: "solid",
					fover: {
						self: {
							...focusReset,
							borderColor: (theme: Theme) => theme.accent,
						},
						title: {
							textDecorationLine: "underline",
						},
					},
				})}
			>
				<PosterBackground
					src={poster}
					alt=""
					quality="low"
					layout={{ height: percent(100) }}
					style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
				>
					<View
						{...css({
							bg: (theme) => theme.darkOverlay,
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							p: ts(1),
						})}
					>
						<P
							{...css([
								{ m: 0, color: (theme: Theme) => theme.colors.white },
								"title",
							])}
						>
							{name}
						</P>
						{subtitle && <SubP {...(css({ m: 0 }) as any)}>{subtitle}</SubP>}
					</View>
					<ItemWatchStatus
						watchStatus={watchStatus}
						availableCount={availableCount}
						seenCount={seenCount}
					/>
				</PosterBackground>
				<View
					{...css({
						flexShrink: 1,
						flexGrow: 1,
						justifyContent: "flex-end",
						marginBottom: px(50),
					})}
				>
					<View
						{...css({
							flexDirection: "row-reverse",
							justifyContent: "space-between",
							alignContent: "flex-start",
						})}
					>
						{kind !== "collection" && (
							<ItemContext
								kind={kind}
								slug={slug}
								status={watchStatus}
								isOpen={moreOpened}
								setOpen={(v) => setMoreOpened(v)}
							/>
						)}
						{tagline && <P {...css({ p: ts(1) })}>{tagline}</P>}
					</View>
					<ScrollView {...css({ pX: ts(1) })}>
						<SubP {...css({ textAlign: "justify" })}>
							{description ?? t("show.noOverview")}
						</SubP>
					</ScrollView>
				</View>
			</Link>

			{/* This view needs to be out of the Link because nested <a> are not allowed on the web */}
			<View
				{...css({
					position: "absolute",
					// Take the border into account
					bottom: ts(0.25),
					right: ts(0.25),
					borderWidth: ts(0.25),
					borderColor: "transparent",
					borderBottomEndRadius: px(6),
					overflow: "hidden",
					// Calculate the size of the poster
					left: calc(px(ItemDetails.layout.size), "*", 2 / 3),
					bg: (theme) => theme.themeOverlay,
					flexDirection: "row",
					pX: 4,
					justifyContent: "flex-end",
					height: px(50),
				})}
			>
				{genres && (
					<ScrollView
						horizontal
						contentContainerStyle={{ alignItems: "center" }}
					>
						{genres.map((x, i) => (
							<Chip
								key={x ?? i}
								label={t(`genres.${x}`)}
								href={"#"}
								size="small"
								{...css({ mX: ts(0.5) })}
							/>
						))}
					</ScrollView>
				)}
				{playHref !== null && (
					<IconFab
						icon={PlayArrow}
						size={20}
						as={Link}
						href={playHref}
						{...tooltip(t("show.play"))}
						{...css({
							fover: { self: { transform: "scale(1.2)" as any, mX: ts(0.5) } },
						})}
					/>
				)}
			</View>
		</View>
	);
};

ItemDetails.Loader = (props: object) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					height: ItemDetails.layout.size,
					flexDirection: "row",
					bg: (theme) => theme.variant.background,
					borderRadius: px(12),
					overflow: "hidden",
					borderColor: (theme) => theme.background,
					borderWidth: ts(0.25),
					borderStyle: "solid",
				},
				props,
			)}
		>
			<PosterBackground
				src={null}
				alt=""
				quality="low"
				layout={{ height: percent(100) }}
				style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
			>
				<View
					{...css({
						bg: (theme) => theme.darkOverlay,
						position: "absolute",
						left: 0,
						right: 0,
						bottom: 0,
						p: ts(1),
					})}
				>
					<Skeleton {...css({ width: percent(100) })} />
					<Skeleton {...css({ height: rem(0.8) })} />
				</View>
			</PosterBackground>
			<View {...css({ flexShrink: 1, flexGrow: 1 })}>
				<View {...css({ flexGrow: 1, flexShrink: 1, pX: ts(1) })}>
					<Skeleton {...css({ marginVertical: ts(2) })} />
					<Skeleton lines={5} {...css({ height: rem(0.8) })} />
				</View>
				<View
					{...css({
						bg: (theme) => theme.themeOverlay,
						pX: 4,
						height: px(50),
						flexDirection: "row",
						alignItems: "center",
					})}
				>
					<Chip.Loader size="small" {...css({ mX: ts(0.5) })} />
					<Chip.Loader size="small" {...css({ mX: ts(0.5) })} />
				</View>
			</View>
		</View>
	);
};

ItemDetails.layout = {
	size: ts(36),
	numColumns: { xs: 1, md: 2, xl: 3 },
	layout: "grid",
	gap: { xs: ts(1), md: ts(8) },
} satisfies Layout;

export const Recommended = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View
			{...css({ marginX: ItemGrid.layout.gap, marginTop: ItemGrid.layout.gap })}
		>
			<H3 {...css({ pX: ts(0.5) })}>{t("home.recommended")}</H3>
			<InfiniteFetch
				query={Recommended.query()}
				layout={ItemDetails.layout}
				placeholderCount={6}
				fetchMore={false}
				contentContainerStyle={{ marginHorizontal: 0 }}
				Render={({ item }) => (
					<ItemDetails
						slug={item.slug}
						kind={item.kind}
						name={item.name}
						tagline={
							item.kind !== "collection" && "tagline" in item
								? item.tagline
								: null
						}
						description={item.description}
						poster={item.poster}
						subtitle={item.kind !== "collection" ? getDisplayDate(item) : null}
						genres={
							item.kind !== "collection" && "genres" in item
								? item.genres
								: null
						}
						href={item.href}
						playHref={item.kind !== "collection" ? item.playHref : null}
						watchStatus={
							(item.kind !== "collection" && item.watchStatus?.status) || null
						}
						unseenEpisodesCount={
							item.kind === "serie"
								? item.availableCount - (item.watchStatus?.seenCount ?? 0)
								: null
						}
					/>
				)}
				Loader={ItemDetails.Loader}
			/>
		</View>
	);
};

Recommended.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		sort: "random",
		limit: 6,
		with: ["firstEntry"],
	},
});
