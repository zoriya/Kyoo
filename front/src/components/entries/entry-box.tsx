import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Entry, KImage } from "~/models";
import {
	Image,
	Link,
	P,
	Skeleton,
	SubP,
	ThumbnailBackground,
	ts,
} from "~/primitives";
import type { Layout } from "~/query";
import { cn } from "~/utils";
import { EntryContext } from "../items/context-menus";
import { ItemProgress } from "../items/item-grid";

export const EntryBox = ({
	kind,
	slug,
	serieSlug,
	name,
	description,
	thumbnail,
	href,
	watchedPercent,
	videos,
	onSelectVideos,
	className,
	...props
}: {
	kind: "movie" | "episode" | "special";
	slug: string;
	// if serie slug is null, disable "Go to serie" in the context menu
	serieSlug: string | null;
	name: string | null;
	description: string | null;
	href: string | null;
	thumbnail: KImage | null;
	watchedPercent: number;
	videos: Entry["videos"];
	onSelectVideos: () => void;
	className?: string;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const { t } = useTranslation();

	return (
		<Link
			href={moreOpened || videos.length > 1 ? undefined : href}
			onPress={videos.length > 1 ? onSelectVideos : undefined}
			onLongPress={() => setMoreOpened(true)}
			className={cn(
				"group w-[200px] items-center p-1 outline-0 sm:w-[240px] xl:w-[350px]",
				href === null && "opacity-50",
				className,
			)}
			{...props}
		>
			{({ focused, hovered }) => {
				const highlighted = focused || hovered || undefined;
				return (
					<>
						<ThumbnailBackground
							src={thumbnail}
							quality="low"
							alt=""
							data-highlighted={highlighted}
							className={cn(
								"aspect-video w-full rounded",
								"data-highlighted:outline-3 data-highlighted:outline-accent",
							)}
						>
							<ItemProgress watchPercent={watchedPercent} />
							<EntryContext
								kind={kind}
								slug={slug}
								serieSlug={serieSlug}
								videoSlug={videos.length === 1 ? videos[0].slug : null}
								isOpen={moreOpened}
								setOpen={setMoreOpened}
								className={cn(
									"absolute top-0 right-0 bg-gray-800/70 hover:bg-gray-800 focus-visible:bg-gray-800",
									"native:hidden opacity-0 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100",
									moreOpened && "opacity-100",
								)}
								iconClassName="fill-slate-200 dark:fill-slate-200"
							/>
						</ThumbnailBackground>
						<P
							data-highlighted={highlighted}
							className="text-center data-highlighted:underline"
						>
							{name ?? t("show.episodeNoMetadata")}
						</P>
						<SubP numberOfLines={3} className="text-center">
							{description}
						</SubP>
					</>
				);
			}}
		</Link>
	);
};

EntryBox.Loader = (props: object) => {
	return (
		<View
			className="h-full w-[200px] items-center p-1 sm:w-[240px] xl:w-[350px]"
			{...props}
		>
			<Image.Loader className="aspect-video w-full" />
			<Skeleton className="w-1/2" />
			<Skeleton className="h-3 w-4/5" />
		</View>
	);
};

// A card is a thumbnail plus three lines of text, so it is a third of a tv
// screen tall at the width it used to have everywhere — a row of them and the
// hero above it did not leave room for a second row.
EntryBox.layout = {
	size: { xs: 200, sm: 240, xl: 350 },
	numColumns: { xs: 3, sm: 4, md: 5, lg: 6, xl: 8 },
	gap: { xs: ts(1), md: ts(2) },
	layout: "grid",
} satisfies Layout;
