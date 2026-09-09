import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import {
	EntrySelect,
	type EntrySelectEntry,
} from "~/components/entries/select";
import { eq, type InitialQueryBuilder, isNull, not } from "@tanstack/react-db";
import { entries, shows } from "~/db";
import { InfiniteList } from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { Header } from "./genre";

export const NewsList = () => {
	const { t } = useTranslation();
	const [selected, setSelected] = useState<EntrySelectEntry | null>(null);

	return (
		<>
			<Header title={t("home.news")}>
				<InfiniteList
					query={NewsList.query}
					pageSize={10}
					layout={{ ...EntryBox.layout, layout: "horizontal" }}
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

/** Entries that got a video, most recent first. */
NewsList.query = (q: InitialQueryBuilder) =>
	q
		.from({ e: entries })
		.innerJoin({ s: shows }, ({ e, s }) => eq(e.showId, s.id))
		.where(({ e }) => not(isNull(e.availableSince)))
		.orderBy(({ e }) => e.availableSince, "desc")
		.select(({ e, s }) => ({ entry: e, show: s }));
