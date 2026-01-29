import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import RSvg, { Path } from "react-native-svg";
import { withUniwind } from "uniwind";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import type { Entry, Serie } from "~/models";
import { Container, H2 } from "~/primitives";
import { Fetch } from "~/query";
import { cn, useQueryState } from "~/utils";
import { Header } from "./header";
import { EntryList } from "./season";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const Svg = withUniwind(RSvg, {
	stroke: {
		fromClassName: "strokeClassName",
		styleProperty: "accentColor",
	},
	fill: {
		fromClassName: "fillClassName",
		styleProperty: "accentColor",
	},
});

export const SvgWave = (props: ComponentProps<typeof Svg>) => {
	// aspect-[width/height]: width/height of the svg
	return (
		<View className="aspect-[612/52.771] w-full">
			<Svg width="100%" height="100%" viewBox="0 372.979 612 52.771" {...props}>
				<Path d="M0,375.175c68,-5.1,136,-0.85,204,7.948c68,9.052,136,22.652,204,24.777s136,-8.075,170,-12.878l34,-4.973v35.7h-612" />
			</Svg>
		</View>
	);
};

export const NextUp = (nextEntry: Entry) => {
	const { t } = useTranslation();

	return (
		<Container className="my-4 overflow-hidden rounded-2xl bg-card hover:bg-accent">
			<H2 className="ml-4">{t("show.nextUp")}</H2>
			<EntryLine
				{...nextEntry}
				serieSlug={null}
				watchedPercent={nextEntry.progress.percent}
				displayNumber={entryDisplayNumber(nextEntry)}
			/>
		</Container>
	);
};

NextUp.Loader = () => {
	const { t } = useTranslation();

	return (
		<Container className="my-4 overflow-hidden rounded-2xl bg-card">
			<H2 className="ml-4">{t("show.nextUp")}</H2>
			<EntryLine.Loader />
		</Container>
	);
};

const SerieHeader = () => {
	const [slug] = useQueryState("slug", undefined!);

	return (
		<View className="bg-background">
			<Header kind="serie" slug={slug} />
			<Fetch
				// Use the same fetch query as header
				query={Header.query("serie", slug)}
				Render={(serie) => {
					const nextEntry = (serie as Serie).nextEntry;
					return nextEntry ? <NextUp {...nextEntry} /> : null;
				}}
				Loader={NextUp.Loader}
			/>
			{/* <DetailsCollections type="serie" slug={slug} /> */}
			{/* <Staff slug={slug} /> */}
			<SvgWave fillClassName={cn("accent-card")} className="flex-1 shrink-0" />
		</View>
	);
};

export const SerieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const [season] = useQueryState("season", undefined!);
	const insets = useSafeAreaInsets();

	return (
		<View className="flex-1 bg-card">
			<EntryList
				slug={slug}
				season={season}
				Header={SerieHeader}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			/>
		</View>
	);
};
