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
				"group min-h-56 flex-1 overflow-hidden rounded-xl ring-accent hover:ring-3 focus-visible:ring-3",
				className,
			)}
		>
			<ImageBackground
				src={banner}
				quality="high"
				alt=""
				className="flex-1 justify-center p-6"
			>
				<View className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/50 to-transparent" />
				<H2
					className={cn(
						"py-2",
						"text-slate-200 dark:text-slate-200",
						"group-focus-within:underline group-hover:underline",
					)}
				>
					{t("show.partOf")} {name}
				</H2>
				<P className="text-justify text-slate-400 dark:text-slate-400">
					{description}
				</P>
			</ImageBackground>
		</Link>
	);
};
