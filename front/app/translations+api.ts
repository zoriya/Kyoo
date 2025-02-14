import { supportedLanguages } from "~/providers/translations.ssr";

export default (): Response => {
	return Response.json(supportedLanguages);
};
