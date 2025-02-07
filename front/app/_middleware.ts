import { createMiddleware, setServerData } from "one";

export default createMiddleware(({ request, next }) => {
	console.log(request);
	setServerData("cookies", request.headers.get("Cookies") ?? "");
	return next();
});
