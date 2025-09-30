import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
	percent,
	rem,
	type Stylable,
	type Theme,
	useYoshiki,
} from "yoshiki/native";
import type { KImage } from "~/models";
import {
	focusReset,
	Image,
	ImageBackground,
	Link,
	P,
	Skeleton,
	SubP,
	ts,
} from "~/primitives";

export const EntryBox = ({
	slug,
	serieSlug,
	name,
	description,
	thumbnail,
	href,
	watchedPercent,
	// watchedStatus,
	...props
}: Stylable & {
	slug: string;
	// if serie slug is null, disable "Go to serie" in the context menu
	serieSlug: string | null;
	name: string | null;
	description: string | null;
	href: string;
	thumbnail: KImage | null;
	watchedPercent: number | null;
	// watchedStatus: WatchStatusV | null;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const { css } = useYoshiki("episodebox");
	const { t } = useTranslation();

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			{...css(
				{
					alignItems: "center",
					child: {
						poster: {
							borderColor: (theme) => theme.background,
							borderWidth: ts(0.5),
							borderStyle: "solid",
							borderRadius: 6,
						},
						more: {
							opacity: 0,
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
							opacity: 1,
						},
					},
				},
				props,
			)}
		>
			<ImageBackground
				src={thumbnail}
				quality="low"
				alt=""
				layout={{ width: percent(100), aspectRatio: 16 / 9 }}
				{...(css("poster") as any)}
			>
				{/* 	{(watchedPercent || watchedStatus === "completed") && ( */}
				{/* 		<ItemProgress watchPercent={watchedPercent ?? 100} /> */}
				{/* 	)} */}
				{/* 	<EntryContext */}
				{/* 		slug={slug} */}
				{/* 		serieSlug={serieSlug} */}
				{/* 		status={watchedStatus} */}
				{/* 		isOpen={moreOpened} */}
				{/* 		setOpen={(v) => setMoreOpened(v)} */}
				{/* 		{...css([ */}
				{/* 			{ */}
				{/* 				position: "absolute", */}
				{/* 				top: 0, */}
				{/* 				right: 0, */}
				{/* 				bg: (theme) => theme.darkOverlay, */}
				{/* 			}, */}
				{/* 			"more", */}
				{/* 			Platform.OS === "web" && */}
				{/* 				moreOpened && { display: important("flex") }, */}
				{/* 		])} */}
				{/* 	/> */}
			</ImageBackground>
			<P {...css([{ marginY: 0, textAlign: "center" }, "title"])}>
				{name ?? t("show.episodeNoMetadata")}
			</P>
			<SubP
				numberOfLines={3}
				{...css({
					marginTop: 0,
					textAlign: "center",
				})}
			>
				{description}
			</SubP>
		</Link>
	);
};

EntryBox.Loader = (props: Stylable) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					alignItems: "center",
				},
				props,
			)}
		>
			<Image.Loader layout={{ width: percent(100), aspectRatio: 16 / 9 }} />
			<Skeleton {...css({ width: percent(50) })} />
			<Skeleton {...css({ width: percent(75), height: rem(0.8) })} />
		</View>
	);
};
