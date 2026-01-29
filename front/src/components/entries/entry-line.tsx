import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import ExpandLess from "@material-symbols/svg-400/rounded/keyboard_arrow_up-fill.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import { EntryContext } from "~/components/items/context-menus";
import { ItemProgress } from "~/components/items/item-grid";
import type { KImage } from "~/models";
import {
	Heading,
	IconButton,
	Image,
	ImageBackground,
	Link,
	P,
	Skeleton,
	SubP,
	tooltip,
	ts,
} from "~/primitives";
import type { Layout } from "~/query";
import { cn, displayRuntime } from "~/utils";

export const EntryLine = ({
	slug,
	serieSlug,
	name,
	tagline,
	thumbnail,
	poster,
	description,
	displayNumber,
	airDate,
	runtime,
	watchedPercent,
	href,
	className,
	...props
}: {
	slug: string;
	// if show slug is null, disable "Go to show" in the context menu
	serieSlug: string | null;
	displayNumber: string;
	name: string | null;
	tagline?: string | null;
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
	const { t } = useTranslation();

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			className={cn(
				"group flex-row items-center",
				href === null && "opacity-50",
				className,
			)}
			{...props}
		>
			<ImageBackground
				src={poster ?? thumbnail}
				quality="low"
				alt=""
				className={cn(
					"m-1 w-1/5 shrink-0 rounded",
					poster ? "aspect-2/3" : "aspect-video",
					"group-hover:ring-3 group-hover:ring-accent group-focus-visible:ring-3 group-focus-visible:ring-accent",
				)}
			>
				{(watchedPercent ?? 0) > 0 && (
					<ItemProgress watchPercent={watchedPercent ?? 100} />
				)}
			</ImageBackground>
			<View className="m-1 mx-2 flex-1">
				<View className="flex-1 flex-row justify-between">
					<View className="mb-5 flex-1">
						<Heading
							className={cn(
								"font-medium group-hover:underline group-focus-visible:underline",
								"text-lg",
							)}
						>
							{[displayNumber, name ?? t("show.episodeNoMetadata")]
								.filter((x) => x)
								.join(" · ")}
						</Heading>
						{tagline && <Heading>{tagline}</Heading>}
					</View>
					<View className="flex-row items-center">
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
							className={cn(
								"ml-3 flex",
								"not:web:opacity-100 opacity-0 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100",
								moreOpened && "opacity-100",
							)}
						/>
					</View>
				</View>
				<View className="flex-row justify-between">
					<P numberOfLines={descriptionExpanded ? undefined : 3}>
						{description}
					</P>
					<IconButton
						className="not:web:opacity-100 opacity-0 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
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

EntryLine.Loader = ({ className, ...props }: { className?: string }) => {
	return (
		<View className={cn("flex-row items-center", className)} {...props}>
			<Image.Loader className="shring-0 m-1 aspect-video w-1/5" />
			<View className="m-1 flex-1">
				<View className="flex-1 flex-row justify-between">
					<Skeleton className="w-2/5" />
					<Skeleton className="w-1/10" />
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
