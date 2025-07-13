import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import type { KyooError } from "~/models";

type Error = {
	key: string;
	error?: KyooError;
	retry?: () => void;
};

export const ErrorContext = createContext<Error | null>(null);
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

export const useSetError = (key: string) => {
	const { setError, clearError } = useContext(ErrorSetterContext);
	const set = ({
		key: nKey,
		...obj
	}: Omit<Error, "key"> & { key?: Error["key"] } = {}) =>
		setError({ key: nKey ?? key, ...obj });
	const clear = () => clearError(key);
	return [set, clear] as const;
};
