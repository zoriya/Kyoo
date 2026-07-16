/// <reference types="bun" />
import { glob, readdir } from "node:fs/promises";
import path from "node:path";

async function fonts() {
	const srcDir = new URL(
		"../node_modules/@expo-google-fonts/",
		import.meta.url,
	);
	const destDir = new URL("../public/fonts/", import.meta.url);

	for await (const file of glob(`${srcDir.pathname}**/*.ttf`)) {
		const src = await Bun.file(file).arrayBuffer();
		await Bun.write(new URL(path.basename(file), destDir), src);
	}
}

async function jassub() {
	const srcDir = new URL("../node_modules/jassub/dist/", import.meta.url);
	const destDir = new URL("../public/jassub/", import.meta.url);

	const build = await Bun.build({
		entrypoints: [new URL("worker/worker.js", srcDir).pathname],
		target: "browser",
		format: "esm",
	});
	if (!build.success)
		throw new AggregateError(build.logs, "failed to bundle jassub worker");
	await Bun.write(
		new URL("jassub-worker.js", destDir),
		await build.outputs[0].text(),
	);

	for (const file of [
		"wasm/jassub-worker.wasm",
		"wasm/jassub-worker-modern.wasm",
		"default.woff2",
	]) {
		await Bun.write(
			new URL(path.basename(file), destDir),
			Bun.file(new URL(file, srcDir)),
		);
	}
}

async function libpgs() {
	const srcDir = new URL("../node_modules/libpgs/dist/", import.meta.url);
	const destDir = new URL("../public/libpgs/", import.meta.url);

	await Bun.write(
		new URL("libpgs.worker.js", destDir),
		Bun.file(new URL("libpgs.worker.js", srcDir)),
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

await fonts();
await jassub();
await libpgs();
await translations();
