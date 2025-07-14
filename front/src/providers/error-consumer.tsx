import { type ReactNode, useContext } from "react";
import { ErrorView, errorHandlers } from "~/ui/errors";
import { ErrorContext } from "./error-provider";

export const ErrorConsumer = ({
	children,
	scope,
}: {
	children: ReactNode;
	scope: string;
}) => {
	const error = useContext(ErrorContext);
	if (!error) return children;

	const handler = errorHandlers[error.key] ?? { view: ErrorView };
	if (handler.forbid && handler.forbid !== scope) return children;
	const Handler = handler.view;
	const { key, ...val } = error;
	return <Handler {...(val as any)} />;
};
