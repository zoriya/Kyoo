import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { Show } from "~/models";
import { P } from "~/primitives";
import { Fetch, prefetch, type QueryIdentifier } from "~/query";

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
				Render={({ name }) => <P {...(css({ bg: "red" }) as any)}>{name}</P>}
				Loader={() => <P>Loading</P>}
			/>
		</View>
	);
}

Header.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["shows", "random"],
	params: {
		fields: ["firstEntry"],
	},
});
