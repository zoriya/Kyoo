import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import {
	EntrySelect,
	type EntrySelectEntry,
} from "~/components/entries/select";
import { ItemGrid } from "~/components/items";
import { InfiniteFetch, type QueryIdentifier } from "~/data";
import { Entry } from "~/models";
import { showImages } from "~/models/utils/images";
import { Button, Link, P } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { EmptyView } from "~/ui/empty-view";
import { useSetting } from "~/ui/settings/base";
import { Header } from "./genre";

export const NextupList = () => {
	const { t } = useTranslation();
	const account = useAccount();
	const [preferOriginal] = useSetting("preferOriginal", "non-logo");
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
				<InfiniteFetch
					extraData={preferOriginal}
					query={NextupList.query()}
					layout={{ ...ItemGrid.layout, layout: "horizontal" }}
					Empty={<EmptyView message={t("home.none")} className="py-6" />}
					Render={({ item }) => (
						<EntryBox
							id={item.id}
							kind={item.kind}
							slug={item.slug}
							serieSlug={item.show!.slug}
							name={`${item.show!.name} ${entryDisplayNumber(item)}`}
							description={item.name}
							thumbnail={
								item.thumbnail ??
								showImages(item.show!, preferOriginal).thumbnail
							}
							href={item.href}
							watchedPercent={item.progress?.percent ?? 0}
							videos={item.videos}
							onSelectVideos={() =>
								setSelected({
									displayNumber: entryDisplayNumber(item),
									name: item.name,
									videos: item.videos,
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

NextupList.query = (): QueryIdentifier<Entry> => ({
	schema: Entry,
	infinite: true,
	path: ["api", "profiles", "me", "nextup"],
	params: {
		limit: 10,
		with: ["nextEntry"],
	},
});
