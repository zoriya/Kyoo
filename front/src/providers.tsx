import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComponentType, type ReactNode, useState } from "react";
// import { useUserTheme } from "@kyoo/models";
// import { createQueryClient } from "@kyoo/models";
import { ThemeSelector } from "~/primitives/theme";

const QueryProvider = ({ children }: { children: ReactNode }) => {
	// const [queryClient] = useState(() => createQueryClient());
	const [queryClient] = useState(() => new QueryClient({}));
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
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
			<ThemeProvider>{children}</ThemeProvider>
		</QueryProvider>
	);
};
