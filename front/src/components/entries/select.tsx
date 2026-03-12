import { P, Popup } from "~/primitives";

export const EntrySelect = ({
	name,
	videos,
	close,
}: {
	name: string;
	videos: { slug: string; path: string }[];
	close?: () => void;
}) => {
	return (
		<Popup title={name} close={close}>
			{videos.map((x) => (
				<P key={x.slug}>{x.path}</P>
			))}
		</Popup>
	);
};
