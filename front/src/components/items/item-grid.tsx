import { useState } from "react";
import { View } from "react-native";
import type { KImage, WatchStatusV } from "~/models";
import {
	Link,
	P,
	Poster,
	PosterBackground,
	Skeleton,
	SubP,
	ts,
} from "~/primitives";
import type { Layout } from "~/query";
import { cn } from "~/utils";
import { ItemContext } from "./context-menus";
import { ItemWatchStatus } from "./item-helpers";

export const ItemProgress = ({ watchPercent }: { watchPercent: number }) => {
	if (!watchPercent) return null;
	return (
		<>
			<View className="absolute bottom-0 h-1 w-full bg-slate-400" />
			<View
				className="absolute bottom-0 h-1 bg-accent"
				style={{ width: `${watchPercent}%` }}
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
	availableCount,
	seenCount,
	horizontal = false,
	className,
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
	availableCount?: number | null;
	seenCount?: number | null;
	horizontal?: boolean;
	className?: string;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			className={cn(
				"group items-center outline-0",
				horizontal && "h-full w-[200px]",
				className,
			)}
			{...props}
		>
			<PosterBackground
				src={poster}
				alt=""
				quality="low"
				className={cn(
					"w-full",
					"ring-accent group-hover:ring-3 group-focus-visible:ring-3",
				)}
			>
				<ItemWatchStatus
					watchStatus={watchStatus}
					availableCount={availableCount}
					seenCount={seenCount}
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
						className={cn(
							"absolute top-0 right-0 bg-gray-800/70 hover:bg-gray-800 focus-visible:bg-gray-800",
							"native:hidden opacity-0 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100",
							moreOpened && "opacity-100",
						)}
						iconClassName="fill-slate-200 dark:fill-slate-200"
					/>
				)}
			</PosterBackground>
			<P
				numberOfLines={subtitle ? 1 : 2}
				className="text-center group-focus-within:underline group-hover:underline"
			>
				{name}
			</P>
			{subtitle && <SubP className="text-center">{subtitle}</SubP>}
		</Link>
	);
};

ItemGrid.Loader = (props: object) => {
	return (
		<View className="w-full items-center" {...props}>
			<Poster.Loader className="w-full" />
			<Skeleton />
			<Skeleton className="w-1/2" />
		</View>
	);
};

ItemGrid.layout = {
	size: 200,
	numColumns: { xs: 3, sm: 4, md: 5, lg: 6, xl: 8 },
	gap: { xs: ts(1), sm: ts(2), md: ts(4) },
	layout: "grid",
} satisfies Layout;
