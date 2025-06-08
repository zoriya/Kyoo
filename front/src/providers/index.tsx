import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
// import { useUserTheme } from "@kyoo/models";
import { ThemeSelector } from "~/primitives/theme";
import { createQueryClient } from "~/query";
import { AccountProvider } from "./account-provider";
import { ErrorConsumer } from "./error-consumer";
import { ErrorProvider } from "./error-provider";
import { TranslationsProvider } from "./translations.native";

function getServerData(key: string) {
}

const QueryProvider = ({ children }: { children: ReactNode }) => {
	const [queryClient] = useState(() => createQueryClient());
	return (
		<QueryClientProvider client={queryClient}>
			<HydrationBoundary state={getServerData("queryState")}>{children}</HydrationBoundary>
		</QueryClientProvider>
	);
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
	// TODO: change "auto" and use the user's theme cookie
	const userTheme = "auto"; //useUserTheme("auto");

	return (
		<ThemeSelector theme={userTheme} font={{ normal: "inherit" }}>
			{children}
		</ThemeSelector>
	);
};

export const Providers = ({ children }: { children: ReactNode }) => {
	return (
		<QueryProvider>
			<ThemeProvider>
				<ErrorProvider>
					<AccountProvider>
						<TranslationsProvider>
							<ErrorConsumer scope="root">{children}</ErrorConsumer>
						</TranslationsProvider>
					</AccountProvider>
				</ErrorProvider>
			</ThemeProvider>
		</QueryProvider>
	);
};
