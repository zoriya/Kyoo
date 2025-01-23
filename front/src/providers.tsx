// import { useUserTheme } from "@kyoo/models";
import { ThemeSelector } from "@kyoo/primitives";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComponentType, ReactNode, useState } from "react";

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

type ProviderComponent<P = {}> = ComponentType<{ children: ReactNode } & P>;
type Provider = ProviderComponent;

const withProviders = (
	providers: Provider[],
): ComponentType<{
	children: ReactNode;
}> => {
	const ProviderImpl = ({ children }: { children: ReactNode }) => {
		return providers.reduceRight(
			(acc, Prov) => <Prov key={Prov.displayName}>{acc}</Prov>,
			children,
		);
	};
	return ProviderImpl;
};

export const Providers = withProviders([
	QueryProvider,
	// AccountProvider,
	// HydratationBoundary,
	ThemeProvider,
	// PortalProvider,
	// SnackbarProvider
	// ConnectionErrorVerifier
	// DownloadProvider
	// NavigationThemeProvider
	// WithLayout
]);
