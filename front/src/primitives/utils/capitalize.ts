export const capitalize = (str: string): string => {
	return str
		.split(" ")
		.map((s) => s.trim())
		.map((s) => {
			if (s.length > 1) {
				return s.charAt(0).toUpperCase() + s.slice(1);
			}
			return s;
		})
		.join(" ");
};
