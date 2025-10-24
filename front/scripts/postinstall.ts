import { readdir , mkdir } from 'node:fs/promises';

const srcDir = new URL("../node_modules/jassub/dist/", import.meta.url);
const destDir = new URL("../public/jassub/", import.meta.url);

await mkdir(destDir, { recursive: true });

const files = await readdir(srcDir);
for (const file of files) {
	const src = await Bun.file(new URL(file, srcDir)).arrayBuffer();
	await Bun.write(new URL(file, destDir), src);
}
