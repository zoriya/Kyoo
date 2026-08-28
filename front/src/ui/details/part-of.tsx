import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { KImage } from "~/models";
import { H2, ImageBackground, Link, P } from "~/primitives";
import { cn } from "~/utils";

export const PartOf = ({
	name,
	description,
	banner,
	href,
	className,
}: {
	name: string;
	description: string | null;
	banner: KImage | null;
	href: string;
	className?: string;
}) => {
	const { t } = useTranslation();

	return (
		<Link
			href={href}
			className={cn(
				"min-h-56 flex-1 overflow-hidden rounded-xl outline-0",
				"highlighted:outline-3 highlighted:outline-accent",
				className,
			)}
		>
			{({ focused, hovered }) => (
				<ImageBackground
					src={banner}
					quality="high"
					alt=""
					className="flex-1 justify-center p-6"
				>
					<View className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/50 to-transparent" />
					{/* a child cannot match its parent's `:focus` — see item-grid for the why */}
					<H2
						data-highlighted={focused || hovered || undefined}
						className={cn(
							"py-2",
							"text-slate-200 dark:text-slate-200",
							"data-highlighted:underline",
						)}
					>
						{t("show.partOf")} {name}
					</H2>
					<P className="text-justify text-slate-400 dark:text-slate-400">
						{description}
					</P>
				</ImageBackground>
			)}
		</Link>
	);
};
