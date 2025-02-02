import { type ReactNode, createContext, useContext, useState } from "react";
import type { KyooError } from "~/models";
import { ErrorView, errorHandlers } from "~/ui/errors";

type Error = {
	key: string;
	error?: KyooError;
	retry?: () => void;
};

const ErrorContext = createContext<{
	error: Error | null;
	setError: (error: Error | null) => void;
}>({ error: null, setError: () => {} });

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
	const [error, setError] = useState<Error | null>(null);

	return (
		<ErrorContext.Provider
			value={{
				error,
				setError,
			}}
		>
			{children}
		</ErrorContext.Provider>
	);
};

export const ErrorConsumer = ({ children, scope }: { children: ReactNode; scope: string }) => {
	const { error } = useContext(ErrorContext);
	if (!error) return children;

	const handler = errorHandlers[error.key] ?? { view: ErrorView };
	if (handler.forbid && handler.forbid !== scope) return children;
	const Handler = handler.view;
	return <Handler {...(error as any)} />;
};
export const useSetError = () => {
	const { setError } = useContext(ErrorContext);
	return setError;
};
