import type { ErrorBoundaryProps } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { RetryableError } from "~/models/retryable-error";
import { Button, H1, P } from "~/primitives";
import "../global.css";
import "~/fonts.web.css";
import { Header, SafeAreaProviderCompat } from "@react-navigation/elements";
import { useCSSVariable } from "uniwind";
import { NavbarProfile, NavbarTitle } from "~/ui/navbar";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
	const accent = useCSSVariable("--color-accent");

	return (
		<SafeAreaProviderCompat>
			<View className="flex-1">
				<Header
					title="Kyoo"
					headerTitle={() => <NavbarTitle />}
					headerRight={() => <NavbarProfile />}
					headerStyle={{ backgroundColor: accent as string }}
				/>
				<ErrorView error={error} retry={retry} />
			</View>
		</SafeAreaProviderCompat>
	);
}

function ErrorView({ error, retry }: ErrorBoundaryProps) {
	const { t } = useTranslation();

	if (!(error instanceof RetryableError)) {
		return (
			<View>
				<P>{error.message ?? t("errors.unknown")}</P>
			</View>
		);
	}
	return (
		<View className="flex-1 items-center justify-center">
			<H1 className="mb-2 text-center text-xl">
				{t(`errors.${error.key}` as any)}
			</H1>
			<P className="my-2">{error.inner?.message ?? t("errors.unknown")}</P>
			{error.key === "offline" && (
				<P className="my-2">{t("errors.connection-tips")}</P>
			)}
			<Button
				className="mt-5"
				text={t("errors.try-again")}
				onPress={async () => {
					await error.retry?.();
					await retry();
				}}
			/>
		</View>
	);
}
