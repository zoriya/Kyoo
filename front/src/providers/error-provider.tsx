import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import type { KyooError } from "~/models";
import { ErrorView, errorHandlers } from "~/ui/errors";

type Error = {
	key: string;
	error?: KyooError;
	retry?: () => void;
};

const ErrorContext = createContext<Error | null>(null);
const ErrorSetterContext = createContext<{
	setError: (error: Error | null) => void;
	clearError: (key: string) => void;
}>(null!);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
	const [error, setError] = useState<Error | null>(null);

	const currentKey = useRef(error?.key);
	currentKey.current = error?.key;
	const clearError = useCallback((key: string) => {
		if (key === currentKey.current) setError(null);
	}, []);
	const provider = useMemo(
		() => ({
			setError,
			clearError,
		}),
		[clearError],
	);

	return (
		<ErrorSetterContext.Provider value={provider}>
			<ErrorContext.Provider value={error}>{children}</ErrorContext.Provider>
		</ErrorSetterContext.Provider>
	);
};

export const ErrorConsumer = ({ children, scope }: { children: ReactNode; scope: string }) => {
	const error = useContext(ErrorContext);
	if (!error) return children;

	const handler = errorHandlers[error.key] ?? { view: ErrorView };
	if (handler.forbid && handler.forbid !== scope) return children;
	const Handler = handler.view;
	const { key, ...val } = error;
	return <Handler {...(val as any)} />;
};
export const useSetError = (key: string) => {
	const { setError, clearError } = useContext(ErrorSetterContext);
	const set = ({ key: nKey, ...obj }: Omit<Error, "key"> & { key?: Error["key"] }) =>
		setError({ key: nKey ?? key, ...obj });
	const clear = () => clearError(key);
	return [set, clear] as const;
};
