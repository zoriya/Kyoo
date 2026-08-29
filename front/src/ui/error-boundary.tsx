import type { ErrorBoundaryProps } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { RetryableError } from "~/models/retryable-error";
import { Button, H1, P } from "~/primitives";
import "../global.css";
import "~/fonts.web.css";
import { Header, SafeAreaProviderCompat } from "expo-router/react-navigation";
import { useCSSVariable } from "uniwind";
import { NavbarProfile, NavbarTitle } from "~/ui/navbar";

export function LayoutErrorBoundary({ error, retry }: ErrorBoundaryProps) {
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

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
	return <ErrorView error={error} retry={retry} />;
}

function ErrorView({ error, retry }: ErrorBoundaryProps) {
	const { t } = useTranslation();
	const retryable = error instanceof RetryableError;

	return (
		<View className="flex-1 items-center justify-center p-4">
			<H1 className="mb-2 text-center text-xl">
				{retryable ? t(`errors.${error.key}` as any) : t("errors.unknown")}
			</H1>
			<P className="my-2 text-center">
				{(retryable ? error.inner?.message : error.message) ??
					t("errors.unknown")}
			</P>
			{retryable && error.key === "offline" && (
				<P className="my-2 text-center">{t("errors.connection-tips")}</P>
			)}
			<Button
				className="mt-5"
				text={t("errors.try-again")}
				onPress={async () => {
					if (retryable) await error.retry?.();
					await retry();
				}}
				hasTVPreferredFocus
			/>
		</View>
	);
}
