import { supportedLanguages } from "~/providers/translations.compile";

export default (): Response => {
	return Response.json(supportedLanguages);
};
