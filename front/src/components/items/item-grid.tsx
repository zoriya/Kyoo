import { useState } from "react";
import { type ImageStyle, Platform, View } from "react-native";
import { percent, type Stylable, type Theme, useYoshiki } from "yoshiki/native";
import type { KImage, WatchStatusV } from "~/models";
import {
	focusReset,
	important,
	Link,
	P,
	Poster,
	PosterBackground,
	Skeleton,
	SubP,
	ts,
} from "~/primitives";
import type { Layout } from "~/query";
import { ItemContext } from "./context-menus";
import { ItemWatchStatus } from "./item-helpers";

export const ItemProgress = ({ watchPercent }: { watchPercent: number }) => {
	const { css } = useYoshiki("episodebox");

	return (
		<>
			<View
				{...css({
					backgroundColor: (theme) => theme.user.overlay0,
					width: percent(100),
					height: ts(0.5),
					position: "absolute",
					bottom: 0,
				})}
			/>
			<View
				{...css({
					backgroundColor: (theme) => theme.user.accent,
					width: percent(watchPercent),
					height: ts(0.5),
					position: "absolute",
					bottom: 0,
				})}
			/>
		</>
	);
};

export const ItemGrid = ({
	href,
	slug,
	name,
	kind,
	subtitle,
	poster,
	watchStatus,
	watchPercent,
	unseenEpisodesCount,
	...props
}: {
	href: string;
	slug: string;
	name: string;
	subtitle: string | null;
	poster: KImage | null;
	watchStatus: WatchStatusV | null;
	watchPercent: number | null;
	kind: "movie" | "serie" | "collection";
	unseenEpisodesCount: number | null;
} & Stylable<"text">) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const { css } = useYoshiki("grid");

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			{...css(
				{
					flexDirection: "column",
					alignItems: "center",
					width: percent(100),
					child: {
						poster: {
							borderColor: (theme) => theme.background,
							borderWidth: ts(0.5),
							borderStyle: "solid",
						},
						more: {
							display: "none",
						},
					},
					fover: {
						self: focusReset,
						poster: {
							borderColor: (theme: Theme) => theme.accent,
						},
						title: {
							textDecorationLine: "underline",
						},
						more: {
							display: "flex",
						},
					},
				},
				props,
			)}
		>
			<PosterBackground
				src={poster}
				alt={name}
				quality="low"
				layout={{ width: percent(100) }}
				{...(css("poster") as { style: ImageStyle })}
			>
				<ItemWatchStatus
					watchStatus={watchStatus}
					unseenEpisodesCount={unseenEpisodesCount}
				/>
				{kind === "movie" && watchPercent && (
					<ItemProgress watchPercent={watchPercent} />
				)}
				{kind !== "collection" && (
					<ItemContext
						kind={kind}
						slug={slug}
						status={watchStatus}
						isOpen={moreOpened}
						setOpen={(v) => setMoreOpened(v)}
						{...css([
							{
								position: "absolute",
								top: 0,
								right: 0,
								bg: (theme) => theme.dark.background,
							},
							"more",
							Platform.OS === "web" &&
								moreOpened && { display: important("flex") },
						])}
					/>
				)}
			</PosterBackground>
			<P
				numberOfLines={subtitle ? 1 : 2}
				{...css([{ marginY: 0, textAlign: "center" }, "title"])}
			>
				{name}
			</P>
			{subtitle && (
				<SubP
					{...css({
						marginTop: 0,
						textAlign: "center",
					})}
				>
					{subtitle}
				</SubP>
			)}
		</Link>
	);
};

ItemGrid.Loader = (props: object) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					flexDirection: "column",
					alignItems: "center",
					width: percent(100),
				},
				props,
			)}
		>
			<Poster.Loader layout={{ width: percent(100) }} />
			<Skeleton />
			<Skeleton {...css({ width: percent(50) })} />
		</View>
	);
};

ItemGrid.layout = {
	size: 150,
	numColumns: { xs: 3, sm: 4, md: 5, lg: 6, xl: 8 },
	gap: { xs: ts(1), sm: ts(2), md: ts(4) },
	layout: "grid",
} satisfies Layout;
