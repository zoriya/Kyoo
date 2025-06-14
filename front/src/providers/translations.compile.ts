// this file is run at compile time thanks to a vite plugin

// import { readFile, readdir } from "node:fs/promises";
// import type { Resource } from "i18next";

// const translationDir = new URL("../../public/translations/", import.meta.url);
// const langs = await readdir(translationDir);

// export const resources: Resource = Object.fromEntries(
// 	await Promise.all(
// 		langs.map(async (x) => [
// 			x.replace(".json", ""),
// 			{ translation: JSON.parse(await readFile(new URL(x, translationDir), "utf8")) },
// 		]),
// 	),
// );

import en from "../../public/translations/en.json";

export const resources = { en };

export const supportedLanguages = Object.keys(resources);
