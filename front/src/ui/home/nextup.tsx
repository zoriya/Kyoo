import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import {
	EntrySelect,
	type EntrySelectEntry,
} from "~/components/entries/select";
import { ItemGrid } from "~/components/items";
import { Button, Link, P } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { eq, inArray, type InitialQueryBuilder } from "@tanstack/react-db";
import { entries, showWatchStatus, shows } from "~/db";
import { InfiniteList } from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { Header } from "./genre";

export const NextupList = () => {
	const { t } = useTranslation();
	const account = useAccount();
	const [selected, setSelected] = useState<EntrySelectEntry | null>(null);

	if (!account) {
		return (
			<Header title={t("home.watchlist")}>
				<View className="items-center justify-center">
					<P>{t("home.watchlistLogin")}</P>
					<Button
						as={Link}
						href={"/login"}
						text={t("login.login")}
						className="m-4 min-w-md"
					/>
				</View>
			</Header>
		);
	}

	return (
		<>
			<Header title={t("home.watchlist")}>
				<InfiniteList
					query={NextupList.query}
					pageSize={10}
					layout={{ ...ItemGrid.layout, layout: "horizontal" }}
					Empty={<EmptyView message={t("home.none")} className="py-6" />}
					getKey={(x) => x.entry.id}
					Render={({ item: { entry, show } }) => (
						<EntryBox
							kind={entry.kind}
							slug={entry.slug}
							serieSlug={show?.slug ?? null}
							name={
								show ? `${show.name} ${entryDisplayNumber(entry)}` : entry.name
							}
							description={entry.name}
							thumbnail={entry.thumbnail ?? show?.thumbnail ?? null}
							href={entry.href}
							watchedPercent={entry.progress.percent}
							videos={entry.videos}
							onSelectVideos={() =>
								setSelected({
									displayNumber: entryDisplayNumber(entry),
									name: entry.name,
									videos: entry.videos,
								})
							}
						/>
					)}
					Loader={EntryBox.Loader}
				/>
			</Header>
			<EntrySelect entry={selected} onClose={() => setSelected(null)} />
		</>
	);
};

/** The next entry of every show being watched, last played first. */
NextupList.query = (q: InitialQueryBuilder) =>
	q
		.from({ s: shows })
		.innerJoin({ e: entries }, ({ s, e }) => eq(s.nextEntryId, e.id))
		.where(({ s }) =>
			inArray(showWatchStatus(s).status, ["watching", "rewatching"]),
		)
		.orderBy(({ s }) => showWatchStatus(s).lastPlayedAt, "desc")
		.select(({ s, e }) => ({ entry: e, show: s }));
