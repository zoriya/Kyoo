import { type ComponentType, type ReactElement, isValidElement } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { P } from "~/primitives";
import { ErrorView } from "./errors";
import { type QueryIdentifier, useFetch } from "./query";

export const Fetch = <Data,>({
	query,
	Render,
	Loader,
}: {
	query: QueryIdentifier<Data>;
	Render: (item: Data) => ReactElement;
	Loader: () => ReactElement;
}): JSX.Element | null => {
	const { data, isPaused, error } = useFetch(query);

	if (error) return <ErrorView error={error} />;
	if (isPaused) return <OfflineView />;
	if (!data) return <Loader />;
	return <Render {...data} />;
};

export const OfflineView = () => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View
			{...css({
				flexGrow: 1,
				flexShrink: 1,
				justifyContent: "center",
				alignItems: "center",
			})}
		>
			<P {...css({ color: (theme) => theme.colors.white })}>{t("errors.offline")}</P>
		</View>
	);
};

export const EmptyView = ({ message }: { message: string }) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				flexGrow: 1,
				justifyContent: "center",
				alignItems: "center",
			})}
		>
			<P {...css({ color: (theme) => theme.heading })}>{message}</P>
		</View>
	);
};
