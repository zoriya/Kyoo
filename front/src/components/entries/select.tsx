import { H1, P, Popup } from "~/primitives";

export const EntrySelect = ({
	name,
	videos,
}: {
	name: string;
	videos: { slug: string; path: string }[];
}) => {
	return (
		<Popup>
			<H1>{name}</H1>
			{videos.map((x) => (
				<P key={x.slug}>{x.path}</P>
			))}
		</Popup>
	);
};
