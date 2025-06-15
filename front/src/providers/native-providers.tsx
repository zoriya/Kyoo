import { PortalProvider } from "@gorhom/portal";
import type { ReactNode } from "react";

export const NativeProviders = ({ children }: { children: ReactNode }) => {
	return <PortalProvider>{children}</PortalProvider>;
};
