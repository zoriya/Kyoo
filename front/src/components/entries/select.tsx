import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import type { Entry } from "~/models";
import {
	HR,
	Icon,
	IconButton,
	Link,
	P,
	Popup,
	SubP,
	tooltip,
} from "~/primitives";

// stolen from https://github.com/jimmywarting/groupby-polyfill/blob/main/lib/polyfill.js
// needed since hermes doesn't support Map.groupBy yet
if (Platform.OS !== "web") {
	Map.groupBy ??= function groupBy(iterable, callbackfn) {
		const map = new Map();
		let i = 0;
		for (const value of iterable) {
			const key = callbackfn(value, i++),
				list = map.get(key);
			list ? list.push(value) : map.set(key, [value]);
		}
		return map;
	};
}

export const EntrySelect = ({
	displayNumber,
	name,
	videos,
	close,
}: {
	displayNumber: string | null;
	name: string;
	videos: Entry["videos"];
	close?: () => void;
}) => {
	const { t } = useTranslation();

	return (
		<Popup
			title={[displayNumber, name].filter((x) => x).join(" · ")}
			close={close}
		>
			{[...Map.groupBy(videos, (v) => v.rendering).entries()].map(
				([rendering, items], i) => (
					<Fragment key={rendering}>
						{i > 0 && <HR />}
						{items.map((x) => (
							<View
								key={x.slug}
								className="flex-row items-center gap-2 rounded p-2"
							>
								<Link
									href={`/watch/${x.slug}`}
									className="flex-1 flex-row items-center gap-2 hover:bg-popover"
								>
									<Icon icon={PlayArrow} className="shrink-0" />
									<View className="flex-1">
										<P>{x.path}</P>
										<SubP>
											{[
												t("show.version", { number: x.version }),
												x.part !== null
													? t("show.part", { number: x.part })
													: null,
											]
												.filter((s) => s != null)
												.join(" · ")}
										</SubP>
									</View>
								</Link>
								<IconButton
									icon={MovieInfo}
									as={Link}
									href={`/info/${x.slug}`}
									{...tooltip(t("home.episodeMore.mediainfo"))}
								/>
							</View>
						))}
					</Fragment>
				),
			)}
		</Popup>
	);
};
