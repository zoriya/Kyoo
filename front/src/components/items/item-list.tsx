import { useState } from "react";
import { Platform, View } from "react-native";
import { percent, px, rem, useYoshiki } from "yoshiki/native";
import type { KImage, WatchStatusV } from "~/models";
import {
	ContrastArea,
	GradientImageBackground,
	Heading,
	important,
	Link,
	P,
	Poster,
	PosterBackground,
	Skeleton,
	ts,
} from "~/primitives";
import type { Layout } from "~/query";
import { ItemContext } from "./context-menus";
import { ItemWatchStatus } from "./item-helpers";

export const ItemList = ({
	href,
	slug,
	kind,
	name,
	subtitle,
	thumbnail,
	poster,
	watchStatus,
	unseenEpisodesCount,
	...props
}: {
	href: string;
	slug: string;
	kind: "movie" | "serie" | "collection";
	name: string;
	subtitle: string | null;
	poster: KImage | null;
	thumbnail: KImage | null;
	watchStatus: WatchStatusV | null;
	unseenEpisodesCount: number | null;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);

	return (
		<ContrastArea>
			{({ css }) => (
				<Link
					href={moreOpened ? undefined : href}
					onLongPress={() => setMoreOpened(true)}
					{...css({
						child: {
							more: {
								opacity: 0,
							},
						},
						fover: {
							title: {
								textDecorationLine: "underline",
							},
							more: {
								opacity: 100,
							},
						},
					})}
					{...props}
				>
					<GradientImageBackground
						src={thumbnail}
						alt={name}
						quality="medium"
						layout={{ width: percent(100), height: ItemList.layout.size }}
						gradientStyle={{
							alignItems: "center",
							justifyContent: "space-evenly",
							flexDirection: "row",
						}}
						{...(css({
							borderRadius: px(10),
							overflow: "hidden",
						}) as any)}
					>
						<View
							{...css({
								width: { xs: "50%", lg: "30%" },
							})}
						>
							<View
								{...css({
									flexDirection: "row",
									justifyContent: "center",
								})}
							>
								<Heading
									{...css([
										"title",
										{
											textAlign: "center",
											fontSize: rem(2),
											letterSpacing: rem(0.002),
											fontWeight: "900",
											textTransform: "uppercase",
										},
									])}
								>
									{name}
								</Heading>
								{kind !== "collection" && (
									<ItemContext
										kind={kind}
										slug={slug}
										status={watchStatus}
										isOpen={moreOpened}
										setOpen={(v) => setMoreOpened(v)}
										{...css([
											{
												// I dont know why marginLeft gets overwritten by the margin: px(2) so we important
												marginLeft: important(ts(2)),
												bg: (theme) => theme.darkOverlay,
											},
											"more",
											Platform.OS === "web" &&
												moreOpened && { opacity: important(100) },
										])}
									/>
								)}
							</View>
							{subtitle && (
								<P
									{...css({
										textAlign: "center",
										marginRight: ts(4),
									})}
								>
									{subtitle}
								</P>
							)}
						</View>
						<PosterBackground
							src={poster}
							alt=""
							quality="low"
							layout={{ height: percent(80) }}
						>
							<ItemWatchStatus
								watchStatus={watchStatus}
								unseenEpisodesCount={unseenEpisodesCount}
							/>
						</PosterBackground>
					</GradientImageBackground>
				</Link>
			)}
		</ContrastArea>
	);
};

ItemList.Loader = (props: object) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					alignItems: "center",
					justifyContent: "space-evenly",
					flexDirection: "row",
					height: ItemList.layout.size,
					borderRadius: px(10),
					overflow: "hidden",
					bg: (theme) => theme.dark.background,
					marginX: ItemList.layout.gap,
				},
				props,
			)}
		>
			<View
				{...css({
					width: { xs: "50%", lg: "30%" },
					flexDirection: "column",
					justifyContent: "center",
				})}
			>
				<Skeleton {...css({ height: rem(2), alignSelf: "center" })} />
				<Skeleton {...css({ width: rem(5), alignSelf: "center" })} />
			</View>
			<Poster.Loader layout={{ height: percent(80) }} />
		</View>
	);
};

ItemList.layout = {
	numColumns: 1,
	size: 300,
	layout: "vertical",
	gap: ts(2),
} satisfies Layout;
