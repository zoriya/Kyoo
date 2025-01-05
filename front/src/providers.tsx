import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComponentType, ReactNode, useState } from "react";

const QueryProvider = ({ children }: { children: ReactNode }) => {
	// const [queryClient] = useState(() => createQueryClient());
	const [queryClient] = useState(() => new QueryClient({}));
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

type ProviderComponent<P = {}> = ComponentType<{ children: ReactNode } & P>;
type Provider = ProviderComponent;

const withProviders = (
	providers: Provider[],
): ComponentType<{
	children: ReactNode;
}> => {
	const ProviderImpl = ({ children }: { children: ReactNode }) => {
		return providers.reduceRight((acc, Prov) => <Prov>{acc}</Prov>, children);
	};
	return ProviderImpl;
};

export const Providers = withProviders([
	QueryProvider,
	// AccountProvider,
	// HydratationBoundary,
	// [ThemeSelector, }],
	// PortalProvider,
	// SnackbarProvider
	// ConnectionErrorVerifier
	// DownloadProvider
	// NavigationThemeProvider
	// WithLayout
]);
