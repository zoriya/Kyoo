// Typed as UserConfig for handy autocomplete
import type { UserConfig } from "vite";
import { one } from "one/vite";

export default {
	ssr: {
		// needed to fix ssr error of react-query
		noExternal: true,
	},
	plugins: [one()],
} satisfies UserConfig;
