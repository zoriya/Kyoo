import {
	Atlas,
	Canvas,
	rect,
	Skia,
	type SkImage,
	type SkRect,
	useRSXformBuffer,
} from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
	type SharedValue,
	useDerivedValue,
} from "react-native-reanimated";
import type { Chapter } from "~/models";
import { P, SubP } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useQueryState } from "~/utils";
import { toTimerString } from "./controls/progress";
import { type Thumb, useScrubber } from "./scrubber";

// Decode a sprite-sheet URL into a GPU-resident SkImage, sending the same auth
// header the expo-image <Sprite> uses on native. Skia's `useImage` can't attach
// headers, so we fetch the bytes ourselves and wrap them in an SkImage.
const useSheetImage = (url: string) => {
	const { authToken } = useToken();
	const [image, setImage] = useState<SkImage | null>(null);

	useEffect(() => {
		let cancelled = false;
		let loaded: SkImage | null = null;
		(async () => {
			try {
				const res = await fetch(url, {
					headers: authToken
						? { Authorization: `Bearer ${authToken}` }
						: undefined,
				});
				const bytes = new Uint8Array(await res.arrayBuffer());
				loaded = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(bytes));
				if (cancelled) loaded?.dispose();
				else setImage(loaded);
			} catch {
				// A sheet that fails to load just leaves its cells blank.
			}
		})();
		return () => {
			cancelled = true;
			loaded?.dispose();
		};
	}, [url, authToken]);

	return image;
};

// A sheet grouped for drawing: the source rect of every cell and where each one
// sits along the filmstrip (its left edge in dp).
type Sheet = { url: string; sprites: SkRect[]; lefts: number[] };

// One <Atlas> per sprite sheet: it blits many source cells out of a single GPU
// texture in one draw call — which is exactly what a filmstrip is. The per-cell
// transforms are recomputed on the UI thread from `panX`, so panning the strip
// never touches the JS thread or re-renders React.
const SheetAtlas = ({
	sheet,
	panX,
}: {
	sheet: Sheet;
	panX: SharedValue<number>;
}) => {
	const image = useSheetImage(sheet.url);

	const transforms = useRSXformBuffer(sheet.sprites.length, (val, i) => {
		"worklet";
		// translate only (scos=1, ssin=0): 1 source pixel maps to 1 dp, matching
		// the old <Sprite> sizing.
		val.set(1, 0, sheet.lefts[i] + panX.value, 0);
	});

	if (!image) return null;
	return <Atlas image={image} sprites={sheet.sprites} transforms={transforms} />;
};

export const BottomScrubber = ({
	chapters,
	seek,
	seekProgress,
}: {
	chapters?: Chapter[];
	seek: number;
	seekProgress?: SharedValue<number>;
}) => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { info } = useScrubber(slug);
	const { t } = useTranslation();

	const [viewportWidth, setViewportWidth] = useState(0);

	const width = info[0]?.width ?? 1;
	const height = info[0]?.height ?? 1;

	// Pan (in dp) of the whole strip so the cell at the current drag fraction
	// sits under the center marker. Derived entirely on the UI thread from the
	// gesture's shared value — same maths as the old `translateX`.
	const panX = useDerivedValue(() => {
		const offset = (seekProgress?.value ?? 0) * width * info.length;
		return viewportWidth / 2 - offset - width / 2;
	});

	const chapter = chapters?.findLast(
		(x) => x.startTime <= seek && seek < x.endTime,
	);

	// Static per-sheet geometry (source rects + strip positions), grouped so each
	// sheet becomes a single Atlas draw call. Only recomputed when the thumbnail
	// data changes — never during a drag.
	const sheets = useMemo(() => {
		const groups = new Map<string, Sheet>();
		info.forEach((thumb, i) => {
			let group = groups.get(thumb.url);
			if (!group) {
				group = { url: thumb.url, sprites: [], lefts: [] };
				groups.set(thumb.url, group);
			}
			group.sprites.push(rect(thumb.x, thumb.y, thumb.width, thumb.height));
			group.lefts.push(i * width);
		});
		return [...groups.values()];
	}, [info, width]);

	return (
		<View
			className="overflow-hidden"
			style={{ height }}
			onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
		>
			<Canvas style={{ flex: 1 }}>
				{sheets.map((sheet) => (
					<SheetAtlas key={sheet.url} sheet={sheet} panX={panX} />
				))}
			</Canvas>
			<View className="absolute top-0 right-1/2 bottom-0 left-1/2 w-1 bg-slate-200" />
			<View className="absolute inset-0 items-center">
				<P className="rounded bg-slate-800 p-1 text-center text-slate-200 dark:text-slate-200">
					{toTimerString(seek)}
					{chapter && `\n${chapter.name}`}
				</P>
				{chapter && chapter.type !== "content" && (
					<SubP>{t(`player.chapters.${chapter.type}`)}</SubP>
				)}
			</View>
		</View>
	);
};
