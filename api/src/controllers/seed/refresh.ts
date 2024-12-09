// oh i hate js dates so much.
export const guessNextRefresh = (airDate: Date | string) => {
	if (typeof airDate === "string") airDate = new Date(airDate);
	const diff = new Date().getTime() - airDate.getTime();
	const days = diff / (24 * 60 * 60 * 1000);

	const ret = new Date();
	if (days <= 4) ret.setDate(ret.getDate() + 4);
	else if (days <= 21) ret.setDate(ret.getDate() + 14);
	else ret.setMonth(ret.getMonth() + 2);
	return ret.toISOString().substring(0, 10);
};
