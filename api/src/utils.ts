// remove indent in multi-line comments
export const comment = (str: TemplateStringsArray) =>
	str.toString().replace(/^\s+/gm, "");
