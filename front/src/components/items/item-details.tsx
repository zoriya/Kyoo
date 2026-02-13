import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { ItemContext } from "~/components/items/context-menus";
import { ItemWatchStatus } from "~/components/items/item-helpers";
import type { Genre, KImage, WatchStatusV } from "~/models";
import {
	Chip,
	IconFab,
	Link,
	P,
	PosterBackground,
	Skeleton,
	SubP,
	tooltip,
	ts,
} from "~/primitives";
import type { Layout } from "~/query";
import { cn } from "~/utils";

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
	className,
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
	className?: string;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const { t } = useTranslation();

	return (
		<View className={cn("h-72", className)} {...props}>
			<Link
				href={moreOpened ? undefined : href}
				onLongPress={() => setMoreOpened(true)}
				className={cn(
					"h-full flex-row overflow-hidden rounded-xl bg-card",
					"group outline-0 ring-accent focus-within:ring-3 hover:ring-3",
				)}
			>
				<PosterBackground
					src={poster}
					alt=""
					quality="low"
					className="h-full rounded-none"
				>
					<View className="absolute bottom-0 w-full bg-slate-900/50 p-2 px-3">
						<P className="text-slate-200 group-focus-within:underline group-hover:underline">
							{name}
						</P>
						{subtitle && <SubP className="text-slate-400">{subtitle}</SubP>}
					</View>
					<ItemWatchStatus
						watchStatus={watchStatus}
						availableCount={availableCount}
						seenCount={seenCount}
					/>
				</PosterBackground>
				<View className="mb-14 flex-1 justify-end p-2">
					<View className="my-2 flex-row-reverse justify-between">
						{kind !== "collection" && (
							<ItemContext
								kind={kind}
								slug={slug}
								status={watchStatus}
								isOpen={moreOpened}
								setOpen={(v) => setMoreOpened(v)}
							/>
						)}
						{tagline && <P className="p-1">{tagline}</P>}
					</View>
					<ScrollView className="px-1">
						<SubP className="text-justify">
							{description ?? t("show.noOverview")}
						</SubP>
					</ScrollView>
				</View>
			</Link>

			{/* This view needs to be out of the Link because nested <a> are not allowed on the web */}
			<View
				className={cn(
					"absolute right-0 bottom-0 left-0 ml-[192px] h-14",
					"flex-row items-center justify-end overflow-hidden bg-popover",
					"overflow-hidden rounded-br-xl",
				)}
			>
				{genres && (
					<ScrollView
						horizontal
						className="h-full"
						contentContainerClassName="items-center"
					>
						{genres.map((x, i) => (
							<Chip
								key={x ?? i}
								label={t(`genres.${x}`)}
								href={`/genres/${x}`}
								size="small"
								className="mx-1"
							/>
						))}
					</ScrollView>
				)}
				{playHref !== null && (
					<IconFab
						icon={PlayArrow}
						as={Link}
						href={playHref}
						className="mx-2"
						{...tooltip(t("show.play"))}
					/>
				)}
			</View>
		</View>
	);
};

ItemDetails.Loader = (props: object) => {
	return (
		<View
			className={"h-72 flex-row overflow-hidden rounded-xl bg-card"}
			{...props}
		>
			<View className="aspect-2/3 h-full bg-gray-400">
				<View className="absolute bottom-0 w-full bg-slate-900/50 p-2 px-3">
					<Skeleton className="h-5 w-4/5" />
					<Skeleton className="h-3.5 w-2/5" />
				</View>
			</View>
			<View className="flex-1">
				<View className="flex-1 p-2">
					<Skeleton className="m-1 my-2" />
					<Skeleton lines={5} className="mx-1 w-full" />
				</View>
				<View className="h-14 flex-row items-center bg-popover">
					<Chip.Loader size="small" className="mx-2" />
					<Chip.Loader size="small" className="mx-2" />
				</View>
			</View>
		</View>
	);
};

ItemDetails.layout = {
	size: 288,
	numColumns: { xs: 1, md: 2, xl: 3 },
	layout: "grid",
	gap: { xs: ts(1), md: ts(8) },
} satisfies Layout;
