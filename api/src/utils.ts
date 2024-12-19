// remove indent in multi-line comments
export const comment = (str: TemplateStringsArray, ...values: any[]) =>
	str.reduce((acc, str, i) => `${acc}${str}${values[i]}`).replace(/^\s+/gm, "");

export type RemovePrefix<
	T extends string,
	Prefix extends string,
> = T extends `${Prefix}${infer Ret}` ? Ret : T;
