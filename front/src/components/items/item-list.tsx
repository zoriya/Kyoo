import { useState } from "react";
import { View } from "react-native";
import type { KImage, WatchStatusV } from "~/models";
import {
	Heading,
	ImageBackground,
	Link,
	P,
	Poster,
	PosterBackground,
	Skeleton,
	ts,
} from "~/primitives";
import type { Layout } from "~/query";
import { cn } from "~/utils";
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
	availableCount,
	seenCount,
	className,
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
	availableCount?: number | null;
	seenCount?: number | null;
	className?: string;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			className={cn(
				"group h-80 w-full outline-0 ring-accent focus-within:ring-3 hover:ring-3",
				className,
			)}
			{...props}
		>
			<ImageBackground
				src={thumbnail}
				quality="medium"
				className="h-full w-full flex-row items-center justify-evenly overflow-hidden rounded"
			>
				<View className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/70" />
				<View className="w-1/2 lg:w-1/3">
					<View className="flex-row justify-center">
						<Heading
							className={cn(
								"text-center text-3xl uppercase",
								"group-focus-within:underline group-hover:underline",
							)}
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
								className={cn(
									"ml-4",
									"bg-gray-800/70 hover:bg-gray-800 focus-visible:bg-gray-800",
									"native:hidden opacity-0 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100",
									moreOpened && "opacity-100",
								)}
								iconClassName="fill-slate-200 dark:fill-slate-200"
							/>
						)}
					</View>
					{subtitle && <P className="mr-8 text-center">{subtitle}</P>}
				</View>
				<PosterBackground
					src={poster}
					alt=""
					quality="low"
					className="h-4/5 ring-accent group-focus-within:ring-4 group-hover:ring-4"
				>
					<ItemWatchStatus
						watchStatus={watchStatus}
						availableCount={availableCount}
						seenCount={seenCount}
					/>
				</PosterBackground>
			</ImageBackground>
		</Link>
	);
};

ItemList.Loader = (props: object) => {
	return (
		<View
			className="h-80 w-full flex-row items-center justify-evenly overflow-hidden rounded bg-slate-800"
			{...props}
		>
			<View className="w-1/2 justify-center lg:w-1/3">
				<Skeleton className="h-8" />
				<Skeleton className="w-2/5" />
			</View>
			<Poster.Loader className="h-4/5" />
		</View>
	);
};

ItemList.layout = {
	numColumns: 1,
	size: 320,
	layout: "vertical",
	gap: ts(2),
} satisfies Layout;
