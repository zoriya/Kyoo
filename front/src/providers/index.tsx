import {
	DefaultTheme,
	ThemeProvider as RNThemeProvider,
} from "@react-navigation/native";
import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { useColorScheme } from "react-native";
import { useTheme } from "yoshiki/native";
import { ThemeSelector } from "~/primitives/theme";
import { createQueryClient } from "~/query";
import { AccountProvider } from "./account-provider";
import { ErrorConsumer } from "./error-consumer";
import { ErrorProvider } from "./error-provider";
import { NativeProviders } from "./native-providers";
import { TranslationsProvider } from "./translations.native";

function getServerData(_key: string) {}

const QueryProvider = ({ children }: { children: ReactNode }) => {
	const [queryClient] = useState(() => createQueryClient());
	return (
		<QueryClientProvider client={queryClient}>
			<HydrationBoundary state={getServerData("queryState")}>
				{children}
			</HydrationBoundary>
		</QueryClientProvider>
	);
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
	// we can't use "auto" here because it breaks the `RnThemeProvider`
	const userTheme = useColorScheme();

	return (
		<ThemeSelector theme={userTheme ?? "light"} font={{ normal: "inherit" }}>
			{children}
		</ThemeSelector>
	);
};

const RnTheme = ({ children }: { children: ReactNode }) => {
	const theme = useTheme();

	return (
		<RNThemeProvider
			value={{
				dark: theme.mode === "dark",
				colors: {
					primary: theme.accent,
					card: theme.variant.background,
					text: theme.paragraph,
					border: theme.background,
					notification: theme.background,
					background: theme.background,
				},
				fonts: DefaultTheme.fonts,
			}}
		>
			{children}
		</RNThemeProvider>
	);
};

export const Providers = ({ children }: { children: ReactNode }) => {
	return (
		<QueryProvider>
			<ThemeProvider>
				<RnTheme>
					<ErrorProvider>
						<AccountProvider>
							<TranslationsProvider>
								<NativeProviders>
									<ErrorConsumer scope="root">{children}</ErrorConsumer>
								</NativeProviders>
							</TranslationsProvider>
						</AccountProvider>
					</ErrorProvider>
				</RnTheme>
			</ThemeProvider>
		</QueryProvider>
	);
};
