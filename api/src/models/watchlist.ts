import { t } from "elysia";

export const Progress = t.Object({
	percent: t.Integer({ minimum: 0, maximum: 100 }),
	time: t.Number({
		minimum: 0,
		description: "When this episode was stopped (in seconds since the start",
	}),
});
export type Progress = typeof Progress.static;
