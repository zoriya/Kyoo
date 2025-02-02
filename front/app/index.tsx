import { useYoshiki } from "yoshiki/native";
import { type LibraryItem, LibraryItemP } from "~/models";
import { P } from "~/primitives";
import { Fetch, type QueryIdentifier } from "~/query";

export async function loader() {
	await prefetchQuery(Header.query());
}

export default function Header() {
	const { css } = useYoshiki();

	return (
		<Fetch
			query={Header.query()}
			Render={({ name }) => <P {...css({ bg: "red" })}>{name}</P>}
			Loader={() => <P>Loading</P>}
		/>
	);
}

Header.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["items", "random"],
	params: {
		fields: ["firstEpisode"],
	},
});
