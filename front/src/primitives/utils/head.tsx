import EHead from "expo-router/head";

export const Head = ({
	title,
	description,
	image,
}: {
	title?: string | null;
	description?: string | null;
	image?: string | null;
}) => {
	return (
		<EHead>
			{title && <title>{`${title} - Kyoo`}</title>}
			{description && <meta name="description" content={description} />}
			{image && <meta property="og:image" content={image} />}
		</EHead>
	);
};
