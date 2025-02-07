import { createMiddleware, setServerData } from "one";

export default createMiddleware(({ request, next }) => {
	setServerData("cookies", request.headers.get("Cookies") ?? "");
	return next();
});
