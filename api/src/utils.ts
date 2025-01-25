// remove indent in multi-line comments
export const comment = (str: TemplateStringsArray, ...values: any[]) =>
	str
		.reduce((acc, str, i) => `${acc}${values[i - 1]}${str}`)
		.replace(/(^\s)|(\s+$)/g, "") // first & last whitespaces
		.replace(/^[ \t]+/gm, "") // leading spaces
		.replace(/([^\n])\n([^\n])/g, "$1 $2") // two lines to space separated line
		.replace(/\n{2}/g, "\n"); // keep newline if there's an empty line

export function getYear(date: string) {
	return new Date(date).getUTCFullYear();
}
