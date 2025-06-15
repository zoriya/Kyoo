import "i18next";
import type en from "../public/translations/en.json";

declare module "i18next" {
	interface CustomTypeOptions {
		returnNull: false;
		resources: { translation: typeof en };
	}
}
