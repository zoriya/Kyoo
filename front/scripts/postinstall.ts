import { readdir } from "node:fs/promises";

async function jassub() {
	const srcDir = new URL("../node_modules/jassub/dist/", import.meta.url);
	const destDir = new URL("../public/jassub/", import.meta.url);

	const files = await readdir(srcDir);
	for (const file of files) {
		const src = await Bun.file(new URL(file, srcDir)).arrayBuffer();
		await Bun.write(new URL(file, destDir), src);
	}
}

async function pgs() {
	const src = await Bun.file(
		new URL("../node_modules/libpgs/dist/libpgs.worker.js", import.meta.url),
	).arrayBuffer();
	await Bun.write(
		new URL("../public/pgs/libpgs.worker.js", import.meta.url),
		src,
	);
}

async function translations() {
	const srcDir = new URL("../public/translations/", import.meta.url);
	const dest = new URL(
		"../src/providers/translations.compile.ts",
		import.meta.url,
	);

	const translations = (await readdir(srcDir))
		.map((x) => ({
			file: x,
			lang: x.replace(".json", ""),
			var: x.replace(".json", "").replace("-", "_"),
		}))
		.map((x) => ({
			...x,
			quotedLang: x.lang.includes("-") ? `"${x.lang}"` : x.lang,
		}))
		.sort((a, b) => a.lang.localeCompare(b.lang));
	await Bun.write(
		dest,
		`// this file is auto-generated via a postinstall script.

${translations
	.map((x) => `import ${x.var} from "../../public/translations/${x.file}";`)
	.join("\n")}

export const resources = {
	${translations
		.map((x) => `${x.quotedLang}: { translation: ${x.var} },`)
		.join("\n\t")}
};

export const supportedLanguages = [
	${translations.map((x) => `"${x.lang}",`).join("\n\t")}
];
`,
	);
}

await jassub();
await pgs();
await translations();
