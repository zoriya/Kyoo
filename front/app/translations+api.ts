import { supportedLanguages } from "~/providers/translations.web.ssr";

export default (): Response => {
	return Response.json(supportedLanguages);
};
