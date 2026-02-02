import MultipleVideos from "@material-symbols/svg-400/rounded/subscriptions-fill.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import { EntryContext } from "~/components/items/context-menus";
import { ItemProgress } from "~/components/items/item-grid";
import type { KImage } from "~/models";
import {
	CroppedText,
	Heading,
	Icon,
	Image,
	ImageBackground,
	Link,
	PressableFeedback,
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
	videosCount,
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
	videosCount: number;
} & PressableProps) => {
	const [moreOpened, setMoreOpened] = useState(false);
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
					"mr-1 w-1/5 shrink-0 rounded",
					poster ? "aspect-2/3" : "aspect-video",
					"ring-accent group-hover:ring-3 group-focus-visible:ring-3",
				)}
			>
				{(watchedPercent ?? 0) > 0 && (
					<ItemProgress watchPercent={watchedPercent ?? 100} />
				)}
			</ImageBackground>
			<View className="m-1 mx-2 flex-1">
				<View className="mb-5 flex-1 flex-row">
					<View className="flex-1 flex-row items-center">
						<Heading
							className={cn(
								"shrink font-medium text-lg",
								"group-hover:underline group-focus-visible:underline",
							)}
						>
							{[displayNumber, name ?? t("show.episodeNoMetadata")]
								.filter((x) => x)
								.join(" · ")}
						</Heading>
						{tagline && <Heading>{tagline}</Heading>}
					</View>
					<View className="flex-row">
						<View className="flex-col-reverse justify-end md:flex-row md:items-center">
							{videosCount > 1 && (
								<PressableFeedback
									className="flex-row items-center rounded-2xl bg-popover p-2 md:mx-4"
									{...tooltip(t("show.multiVideos"))}
								>
									<Icon
										icon={MultipleVideos}
										className="fill-accent dark:fill-slate-400"
									/>
									<SubP className="ml-2">
										{t("show.videosCount", { number: videosCount })}
									</SubP>
								</PressableFeedback>
							)}
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
						</View>
						<EntryContext
							slug={slug}
							serieSlug={serieSlug}
							isOpen={moreOpened}
							setOpen={(v) => setMoreOpened(v)}
							className={cn(
								"ml-3 flex native:hidden",
								"opacity-0 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100",
								moreOpened && "opacity-100",
							)}
						/>
					</View>
				</View>
				<CroppedText numberOfLines={3}>{description}</CroppedText>
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
