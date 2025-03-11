// import NextHead from "next/head";

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
		<NextHead>
			{title && <title>{`${title} - Kyoo`}</title>}
			{description && <meta name="description" content={description} />}
			{image && <meta property="og:image" content={image} />}
		</NextHead>
	);
};
