import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { type LibraryItem, LibraryItemP } from "~/models";
import { P } from "~/primitives";
import { Fetch, type QueryIdentifier, prefetch } from "~/query";

export async function loader() {
	await prefetch(Header.query());
}

export default function Header() {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View>
			<P>{t("home.recommended")}</P>
			<Fetch
				query={Header.query()}
				Render={({ name }) => <P {...css({ bg: "red" })}>{name}</P>}
				Loader={() => <P>Loading</P>}
			/>
		</View>
	);
}

Header.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["items", "random"],
	params: {
		fields: ["firstEpisode"],
	},
});
